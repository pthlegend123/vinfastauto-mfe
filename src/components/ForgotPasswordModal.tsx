import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Loader2, Phone, ShieldCheck, KeyRound } from 'lucide-react';
import { authService } from '../services/auth.service';
import './LoginModal.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type ForgotPasswordMode = 'phone' | 'otp-code' | 'new-password' | 'success';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

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
    { icon: <KeyRound size={14} />, label: 'Mật khẩu mới' },
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

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [mode, setMode] = useState<ForgotPasswordMode>('phone');

  // Phone entry
  const [phone, setPhone] = useState('');

  // OTP code
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [telegramUrl, setTelegramUrl] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // New password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (open) {
      setMode('phone');
      setPhone('');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setError('');
      clearTimer();
    }
    return () => clearTimer();
  }, [open]);

  if (!open) return null;

  const switchMode = (next: ForgotPasswordMode) => { setMode(next); setError(''); };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = phone.trim().replace(/\s/g, '');
    if (!/^\d{9,11}$/.test(normalizedPhone)) { setError('Số điện thoại không hợp lệ (9–11 chữ số)'); return; }
    setLoading(true); setError('');
    try {
      const res = await authService.sendForgotPasswordOtp(normalizedPhone);
      if (res.code === 200) {
        setPhone(normalizedPhone);
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setTelegramUrl(typeof res.data === 'string' ? res.data : (res.data as any)?.telegramUrl || '');
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
      const res = await authService.verifyForgotPasswordOtp(phone, code);
      if (res.code === 200) {
        clearTimer();
        switchMode('new-password');
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
      const res = await authService.sendForgotPasswordOtp(phone);
      if (res.code === 200) {
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setTelegramUrl(typeof res.data === 'string' ? res.data : (res.data as any)?.telegramUrl || '');
        startResendTimer();
      } else {
        setError(res.message || 'Không thể gửi lại OTP');
      }
    } catch { setError('Không thể kết nối máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  // ── Step 3: Reset password ────────────────────────────────────────────────

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
    setLoading(true); setError('');
    try {
      const res = await authService.resetCustomerPassword(phone, newPassword);
      if (res.code === 200) {
        switchMode('success');
      } else {
        setError(res.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
      }
    } catch { setError('Không thể kết nối máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const stepNumber = mode === 'phone' ? 1 : mode === 'otp-code' ? 2 : 3;

  return (
    <div className="login-overlay" onClick={handleOverlayClick}>
      <div className="login-modal">
        <button className="login-close" onClick={onClose} aria-label="Đóng"><X size={20} /></button>

        <div className="login-header">
          <svg className="login-logo" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 80L10 20H30L50 50L70 20H90L50 80Z" />
          </svg>
          <h2>Quên mật khẩu</h2>
          <p>Đặt lại mật khẩu của bạn</p>
        </div>

        {mode === 'success' ? (
          <div className="register-success">
            <div className="register-success-icon">✓</div>
            <h3>Đặt lại mật khẩu thành công!</h3>
            <p>Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập với mật khẩu mới.</p>
            <button className="login-submit" onClick={onClose}>Quay lại đăng nhập</button>
          </div>
        ) : (
          <>
            <StepIndicator step={stepNumber as 1 | 2 | 3} />

            {/* Step 1 — Phone */}
            {mode === 'phone' && (
              <form className="login-form" onSubmit={handleSendOtp} noValidate>
                <div className="login-field">
                  <label htmlFor="forgotpw-phone">Số điện thoại <span className="required">*</span></label>
                  <input id="forgotpw-phone" type="tel" placeholder="0912 345 678"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    disabled={loading} autoFocus />
                  <span className="field-hint">Mã OTP sẽ được gửi đến số này</span>
                </div>
                {error && <p className="login-error">{error}</p>}
                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? <><Loader2 size={18} className="spin" /> Đang gửi...</> : 'Gửi mã OTP'}
                </button>
                <p className="auth-switch-hint">
                  Nhớ mật khẩu rồi?{' '}
                  <button type="button" className="auth-switch-link" onClick={onClose}>Quay lại đăng nhập</button>
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
                    <span>Mã OTP đã gửi đến <strong>{phone}</strong></span>
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
                    onClick={() => { clearTimer(); switchMode('phone'); }}>
                    Đổi số điện thoại
                  </button>
                </div>
                {error && <p className="login-error">{error}</p>}
                <button type="submit" className="login-submit" disabled={loading || otpDigits.join('').length < OTP_LENGTH}>
                  {loading ? <><Loader2 size={18} className="spin" /> Đang xác thực...</> : 'Xác thực OTP'}
                </button>
              </form>
            )}

            {/* Step 3 — New password */}
            {mode === 'new-password' && (
              <form className="login-form" onSubmit={handleResetPassword} noValidate>
                <div className="otp-sent-notice otp-sent-notice--success">
                  <ShieldCheck size={18} />
                  <span>Số điện thoại <strong>{phone}</strong> đã xác thực</span>
                </div>
                <div className="login-field">
                  <label htmlFor="newpw-password">Mật khẩu mới <span className="required">*</span></label>
                  <div className="password-wrapper">
                    <input id="newpw-password" type={showPassword ? 'text' : 'password'}
                      placeholder="Tối thiểu 6 ký tự" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} disabled={loading} autoFocus />
                    <button type="button" className="toggle-password" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="login-field">
                  <label htmlFor="newpw-confirm">Xác nhận mật khẩu <span className="required">*</span></label>
                  <div className="password-wrapper">
                    <input id="newpw-confirm" type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Xác nhận mật khẩu mới" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} disabled={loading} />
                    <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(v => !v)} tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && <p className="login-error">{error}</p>}
                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? <><Loader2 size={18} className="spin" /> Đang cập nhật...</> : 'Đặt lại mật khẩu'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
