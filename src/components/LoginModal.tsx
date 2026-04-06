import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../services/auth.service';
import type { RegisterRequest } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import './LoginModal.css';

type Mode = 'login' | 'register';

interface RegForm {
  username: string;
  password: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

const EMPTY_REG: RegForm = {
  username: '', password: '', fullName: '',
  phone: '', email: '', address: '',
};

export default function LoginModal() {
  const { loginModalOpen, closeLoginModal, login, pendingCallback } = useAuth();
  const [mode, setMode] = useState<Mode>('login');

  // Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register
  const [reg, setReg] = useState<RegForm>(EMPTY_REG);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loginModalOpen) {
      setMode('login');
      setUsername(''); setPassword(''); setShowPassword(false);
      setReg(EMPTY_REG); setShowRegPassword(false);
      setRegisterSuccess(false); setError('');
    }
  }, [loginModalOpen]);

  if (!loginModalOpen) return null;

  const switchMode = (next: Mode) => { setMode(next); setError(''); setRegisterSuccess(false); };

  /* ---- Login ---- */
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

  /* ---- Register ---- */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { username: u, password: p, fullName, phone, email, address } = reg;

    if (!u.trim() || !p.trim() || !fullName.trim() || !phone.trim()) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc'); return;
    }
    if (!/^\d{9,11}$/.test(phone.trim())) { setError('Số điện thoại không hợp lệ (9–11 chữ số)'); return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Địa chỉ email không hợp lệ'); return;
    }
    if (p.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }

    const payload: RegisterRequest = {
      username: u.trim(),
      password: p,
      fullName: fullName.trim(),
      phone: phone.trim(),
      ...(email.trim() && { email: email.trim() }),
      ...(address.trim() && { address: address.trim() }),
    };

    setLoading(true); setError('');
    try {
      const res = await authService.register(payload);
      if (res.code === 200 || res.code === 201) {
        setRegisterSuccess(true);
      } else {
        setError(res.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch { setError('Không thể kết nối máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  const setField = (field: keyof RegForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setReg(prev => ({ ...prev, [field]: e.target.value }));

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeLoginModal();
  };

  return (
    <div className="login-overlay" onClick={handleOverlayClick}>
      <div className="login-modal">
        <button className="login-close" onClick={closeLoginModal} aria-label="Đóng"><X size={20} /></button>

        <div className="login-header">
          <svg className="login-logo" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 80L10 20H30L50 50L70 20H90L50 80Z" />
          </svg>
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <p>{mode === 'login' ? 'Vui lòng đăng nhập để tiếp tục' : 'Điền thông tin để đăng ký tài khoản'}</p>
        </div>

        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Đăng nhập</button>
          <button type="button" className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Đăng ký</button>
        </div>

        {/* ---- LOGIN ---- */}
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
              Chưa có tài khoản?{' '}
              <button type="button" className="auth-switch-link" onClick={() => switchMode('register')}>Đăng ký ngay</button>
            </p>
          </form>
        )}

        {/* ---- REGISTER ---- */}
        {mode === 'register' && (
          <>
            {registerSuccess ? (
              <div className="register-success">
                <div className="register-success-icon">✓</div>
                <h3>Đăng ký thành công!</h3>
                <p>Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để tiếp tục.</p>
                <button className="login-submit" onClick={() => switchMode('login')}>Đăng nhập ngay</button>
              </div>
            ) : (
              <form className="login-form" onSubmit={handleRegister} noValidate>

                <p className="form-section-label">Thông tin cá nhân</p>

                <div className="login-field">
                  <label htmlFor="reg-fullname">Họ và tên <span className="required">*</span></label>
                  <input id="reg-fullname" type="text" placeholder="Nguyễn Văn A"
                    value={reg.fullName} onChange={setField('fullName')} disabled={loading} autoFocus />
                </div>

                <div className="login-field">
                  <label htmlFor="reg-username">Tên đăng nhập <span className="required">*</span></label>
                  <input id="reg-username" type="text" placeholder="username"
                    value={reg.username} onChange={setField('username')} disabled={loading} />
                </div>

                <div className="login-field">
                  <label htmlFor="reg-phone">Số điện thoại <span className="required">*</span></label>
                  <input id="reg-phone" type="tel" placeholder="0912 345 678"
                    value={reg.phone} onChange={setField('phone')} disabled={loading} />
                </div>

                <div className="login-field">
                  <label htmlFor="reg-email">
                    Email <span className="optional">(tuỳ chọn)</span>
                  </label>
                  <input id="reg-email" type="email" placeholder="example@gmail.com"
                    value={reg.email} onChange={setField('email')} disabled={loading} />
                </div>

                <div className="login-field">
                  <label htmlFor="reg-address">
                    Địa chỉ <span className="optional">(tuỳ chọn)</span>
                  </label>
                  <input id="reg-address" type="text"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                    value={reg.address} onChange={setField('address')} disabled={loading} />
                </div>

                <div className="login-field">
                  <label htmlFor="reg-password">Mật khẩu <span className="required">*</span></label>
                  <div className="password-wrapper">
                    <input id="reg-password" type={showRegPassword ? 'text' : 'password'}
                      placeholder="Tối thiểu 6 ký tự" value={reg.password}
                      onChange={setField('password')} disabled={loading} />
                    <button type="button" className="toggle-password" onClick={() => setShowRegPassword(v => !v)} tabIndex={-1}>
                      {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? <><Loader2 size={18} className="spin" /> Đang đăng ký...</> : 'Tạo tài khoản'}
                </button>

                <p className="auth-switch-hint">
                  Đã có tài khoản?{' '}
                  <button type="button" className="auth-switch-link" onClick={() => switchMode('login')}>Đăng nhập</button>
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
