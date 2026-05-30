import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Loader2, Phone, ShieldCheck, UserPlus } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';
import './LoginModal.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'login' | 'otp-phone' | 'otp-code' | 'otp-complete';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const getTelegramUrl = (data: unknown) => {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'telegramUrl' in data) {
    const { telegramUrl } = data as { telegramUrl?: unknown };
    return typeof telegramUrl === 'string' ? telegramUrl : '';
  }
  return '';
};

// ─── OTP digit input component ───────────────────────────────────────────────

interface OtpInputProps {
  value: string[];
  onChange: (v: string[]) => void;
  disabled: boolean;
}

function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[idx] = digit;
    onChange(next);
    if (digit && idx < OTP_LENGTH - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        const next = [...value];
        next[idx] = '';
        onChange(next);
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    text.split('').forEach((c, i) => { next[i] = c; });
    onChange(next);
    const focusIdx = Math.min(text.length, OTP_LENGTH - 1);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div className="otp-inputs">
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="otp-box"
          value={value[i] ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          disabled={disabled}
          autoComplete="one-time-code"
          aria-label={`Chữ số OTP thứ ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { icon: <Phone size={14} />, label: 'Số điện thoại' },
    { icon: <ShieldCheck size={14} />, label: 'Xác thực OTP' },
    { icon: <UserPlus size={14} />, label: 'Hoàn tất' },
  ];
  return (
    <div className="step-indicator">
      {steps.map((s, i) => {
        const n = i + 1;
        const state = n < step ? 'done' : n === step ? 'active' : 'pending';
        return (
          <div key={i} className={`step-item step-item--${state}`}>
            <div className="step-circle">{state === 'done' ? '✓' : s.icon}</div>
            <span className="step-label">{s.label}</span>
            {i < steps.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoginModal() {
  const { loginModalOpen, closeLoginModal, login, pendingCallback } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP flow state
  const [otpPhone, setOtpPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [telegramUrl, setTelegramUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Resend timer
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startResendTimer = () => {
    clearTimer();
    setResendTimer(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearTimer(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Reset on modal open
  useEffect(() => {
    if (loginModalOpen) {
      setMode('login');
      setUsername(''); setPassword(''); setShowPassword(false);
      setOtpPhone(''); setOtpDigits(Array(OTP_LENGTH).fill(''));
      setFullName(''); setRegPassword(''); setShowRegPassword(false);
      setRegisterSuccess(false); setError('');
      clearTimer();
    }
    return () => clearTimer();
  }, [loginModalOpen]);

  if (!loginModalOpen) return null;

  const switchMode = (next: Mode) => { setMode(next); setError(''); };

  // ── Login ─────────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Vui lòng nhập đầy đủ thông tin'); return; }
    setLoading(true); setError('');
    try {
      const res = await authService.login({ username: username.trim(), password });
      if (res.code === 200 && res.data) {
        login(res.data);
        closeLoginModal();
        if (pendingCallback) setTimeout(() => pendingCallback(), 100);
      } else {
        setError(res.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch { setError('Không thể kết nối máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = otpPhone.trim().replace(/\s/g, '');
    if (!/^\d{9,11}$/.test(phone)) { setError('Số điện thoại không hợp lệ (9–11 chữ số)'); return; }
    setLoading(true); setError('');
    try {
      const res = await authService.otpSend(phone);
      if (res.code === 200) {
        setOtpPhone(phone);
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setTelegramUrl(getTelegramUrl(res.data));
        switchMode('otp-code');
        startResendTimer();
      } else {
        setError(res.message || 'Không thể gửi OTP. Vui lòng thử lại.');
      }
    } catch { setError('Không thể kết nối máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < OTP_LENGTH) { setError('Vui lòng nhập đủ 6 chữ số'); return; }
    setLoading(true); setError('');
    try {
      const res = await authService.otpVerify(otpPhone, code);
      if (res.code === 200) {
        clearTimer();
        switchMode('otp-complete');
      } else {
        setError(res.message || 'Mã OTP không đúng hoặc đã hết hạn');
      }
    } catch { setError('Không thể kết nối máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true); setError('');
    try {
      const res = await authService.otpSend(otpPhone);
      if (res.code === 200) {
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setTelegramUrl(getTelegramUrl(res.data));
        startResendTimer();
      } else {
        setError(res.message || 'Không thể gửi lại OTP');
      }
    } catch { setError('Không thể kết nối máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  // ── Step 3: Complete registration ─────────────────────────────────────────

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Vui lòng nhập họ và tên'); return; }
    if (!regUsername.trim()) { setError('Vui lòng nhập tên đăng nhập'); return; }
    if (!(regUsername.length === regUsername.trim().length)) { setError('Tên đăng nhập không được chứa khoảng trắng'); return; }
    if (!regPassword.trim()) { setError('Vui lòng nhập mật khẩu'); return; }
    if (regPassword.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }
    setLoading(true); setError('');
    try {
      const res = await authService.otpRegister(otpPhone, regUsername, fullName.trim(), regPassword);
      if (res.code === 200 || res.code === 201) {
        setRegisterSuccess(true);
      } else {
        setError(res.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch { setError('Không thể kết nối máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeLoginModal();
  };

  const isRegisterMode = mode !== 'login';
  const stepNumber = mode === 'otp-phone' ? 1 : mode === 'otp-code' ? 2 : 3;

  return (
    <>
      <ForgotPasswordModal open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
      <div className="login-overlay" onClick={handleOverlayClick}>
        <div className="login-modal">
        <button className="login-close" onClick={closeLoginModal} aria-label="Đóng"><X size={20} /></button>

        <div className="login-header">
          <svg className="login-logo" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 80L10 20H30L50 50L70 20H90L50 80Z" />
          </svg>
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <p>{mode === 'login' ? 'Vui lòng đăng nhập để tiếp tục' : 'Đăng ký bằng số điện thoại'}</p>
        </div>

        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { switchMode('login'); }}>Đăng nhập</button>
          <button type="button" className={`auth-tab ${isRegisterMode ? 'active' : ''}`}
            onClick={() => { if (!isRegisterMode) switchMode('otp-phone'); }}>Đăng ký</button>
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="login-field">
              <label htmlFor="login-username">Tên đăng nhập</label>
              <input id="login-username" type="text" placeholder="Nhập tên đăng nhập"
                value={username} onChange={e => setUsername(e.target.value)} disabled={loading} autoFocus />
            </div>
            <div className="login-field">
              <label htmlFor="login-password">Mật khẩu</label>
              <div className="password-wrapper">
                <input id="login-password" type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu" value={password}
                  onChange={e => setPassword(e.target.value)} disabled={loading} />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? <><Loader2 size={18} className="spin" /> Đang đăng nhập...</> : 'Đăng nhập'}
            </button>
            <p className="auth-switch-hint">
              <button type="button" className="auth-switch-link" onClick={() => setShowForgotPassword(true)}>Quên mật khẩu?</button>
            </p>
            <p className="auth-switch-hint">
              Chưa có tài khoản?{' '}
              <button type="button" className="auth-switch-link" onClick={() => switchMode('otp-phone')}>Đăng ký ngay</button>
            </p>
          </form>
        )}

        {/* ── REGISTER STEPS ── */}
        {isRegisterMode && (
          <>
            {registerSuccess ? (
              <div className="register-success">
                <div className="register-success-icon">✓</div>
                <h3>Đăng ký thành công!</h3>
                <p>Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để tiếp tục.</p>
                <button className="login-submit" onClick={() => switchMode('login')}>Đăng nhập ngay</button>
              </div>
            ) : (
              <>
                <StepIndicator step={stepNumber as 1 | 2 | 3} />

                {/* Step 1 — Phone */}
                {mode === 'otp-phone' && (
                  <form className="login-form" onSubmit={handleSendOtp} noValidate>
                    <div className="login-field">
                      <label htmlFor="otp-phone">Số điện thoại <span className="required">*</span></label>
                      <input id="otp-phone" type="tel" placeholder="0912 345 678"
                        value={otpPhone} onChange={e => setOtpPhone(e.target.value)}
                        disabled={loading} autoFocus />
                      <span className="field-hint">Mã OTP sẽ được gửi đến số này</span>
                    </div>
                    {error && <p className="login-error">{error}</p>}
                    <button type="submit" className="login-submit" disabled={loading}>
                      {loading ? <><Loader2 size={18} className="spin" /> Đang gửi...</> : 'Gửi mã OTP'}
                    </button>
                    <p className="auth-switch-hint">
                      Đã có tài khoản?{' '}
                      <button type="button" className="auth-switch-link" onClick={() => switchMode('login')}>Đăng nhập</button>
                    </p>
                  </form>
                )}

                {/* Step 2 — OTP code */}
                {mode === 'otp-code' && (
                  <form className="login-form" onSubmit={handleVerifyOtp} noValidate>
                    <div className="otp-sent-notice">
                      <ShieldCheck size={18} />
                      {telegramUrl ? (
                        <a href={telegramUrl} target="_blank" rel="noreferrer" className="telegram-btn">
                          Nhấn vào đây để nhận OTP qua Telegram
                        </a>
                      ) : (
                        <span>Mã OTP đã gửi đến <strong>{otpPhone}</strong></span>
                      )}
                    </div>
                    <div className="login-field">
                      <label>Nhập mã OTP <span className="required">*</span></label>
                      <OtpInput value={otpDigits} onChange={setOtpDigits} disabled={loading} />
                    </div>
                    <div className="otp-resend-row">
                      {resendTimer > 0 ? (
                        <span className="otp-timer">Gửi lại sau <strong>{resendTimer}s</strong></span>
                      ) : (
                        <button type="button" className="auth-switch-link" onClick={handleResend} disabled={loading}>
                          Gửi lại mã OTP
                        </button>
                      )}
                      <button type="button" className="auth-switch-link otp-change-phone"
                        onClick={() => { clearTimer(); switchMode('otp-phone'); }}>
                        Đổi số điện thoại
                      </button>
                    </div>
                    {error && <p className="login-error">{error}</p>}
                    <button type="submit" className="login-submit" disabled={loading || otpDigits.join('').length < OTP_LENGTH}>
                      {loading ? <><Loader2 size={18} className="spin" /> Đang xác thực...</> : 'Xác thực OTP'}
                    </button>
                  </form>
                )}

                {/* Step 3 — Complete */}
                {mode === 'otp-complete' && (
                  <form className="login-form" onSubmit={handleRegister} noValidate>
                    <div className="otp-sent-notice otp-sent-notice--success">
                      <ShieldCheck size={18} />
                      <span>Số điện thoại <strong>{otpPhone}</strong> đã xác thực</span>
                    </div>
                    <div className="login-field">
                      <label htmlFor="reg-fullname">Họ và tên <span className="required">*</span></label>
                      <input id="reg-fullname" type="text" placeholder="Nguyễn Văn A"
                        value={fullName} onChange={e => setFullName(e.target.value)}
                        disabled={loading} autoFocus />
                    </div>
                    <div className="login-field">
                      <label htmlFor="reg-username">Tên đăng nhập <span className="required">*</span></label>
                      <input id="reg-username" type="text" placeholder="nguyenvana"
                        value={regUsername} onChange={e => setRegUsername(e.target.value)}
                        disabled={loading} autoFocus />
                    </div>
                    <div className="login-field">
                      <label htmlFor="reg-password">Mật khẩu <span className="required">*</span></label>
                      <div className="password-wrapper">
                        <input id="reg-password" type={showRegPassword ? 'text' : 'password'}
                          placeholder="Tối thiểu 6 ký tự" value={regPassword}
                          onChange={e => setRegPassword(e.target.value)} disabled={loading} />
                        <button type="button" className="toggle-password" onClick={() => setShowRegPassword(v => !v)} tabIndex={-1}>
                          {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    {error && <p className="login-error">{error}</p>}
                    <button type="submit" className="login-submit" disabled={loading}>
                      {loading ? <><Loader2 size={18} className="spin" /> Đang tạo tài khoản...</> : 'Hoàn tất đăng ký'}
                    </button>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
