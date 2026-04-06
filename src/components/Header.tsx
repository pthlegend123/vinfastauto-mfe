import { Menu, User, Globe, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

interface HeaderProps {
  scrolled: boolean;
}

export default function Header({ scrolled }: HeaderProps) {
  const { isLoggedIn, user, logout, openLoginModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccountClick = () => {
    if (isLoggedIn) {
      setDropdownOpen(v => !v);
    } else {
      openLoginModal();
    }
  };

  const handleRegisterTestDrive = () => {
    if (!isLoggedIn) {
      openLoginModal(() => {
        // After login, user can proceed with test drive registration
        alert('Vui lòng điền thông tin đăng ký lái thử.');
      });
    } else {
      alert('Vui lòng điền thông tin đăng ký lái thử.');
    }
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Mobile Menu Icon */}
        <button className="icon-btn mobile-menu">
          <Menu size={24} />
        </button>

        {/* Logo */}
        <a href="/" className="logo">
          <svg className="v-logo" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 80L10 20H30L50 50L70 20H90L50 80Z" />
          </svg>
          <span className="logo-text">VINFAST</span>
        </a>

        {/* Navigation - Desktop */}
        <nav className="desktop-nav">
          <ul>
            <li><a href="#about">Giới thiệu</a></li>
            <li><a href="#cars">Ô tô</a></li>
            <li><a href="#ebikes">Xe máy điện</a></li>
            <li><a href="#services">Dịch vụ hậu mãi</a></li>
            <li><a href="#charging">Pin và trạm sạc</a></li>
          </ul>
        </nav>

        {/* Right Actions */}
        <div className="header-actions">
          <button className="icon-btn hide-mobile">
            <Globe size={20} />
            <span>VN</span>
          </button>

          {/* Account button */}
          <div className="account-wrapper hide-mobile" ref={dropdownRef}>
            <button className="icon-btn" onClick={handleAccountClick}>
              <User size={20} />
              <span>{isLoggedIn ? (user?.customer?.fullName || user?.customer?.username || 'Tài khoản') : 'Tài khoản'}</span>
              {isLoggedIn && <ChevronDown size={14} />}
            </button>

            {isLoggedIn && dropdownOpen && (
              <div className="account-dropdown">
                <div className="account-dropdown-info">
                  <span className="account-name">{user?.customer?.fullName || user?.customer?.username}</span>
                  {user?.customer?.email && <span className="account-email">{user.customer.email}</span>}
                </div>
                <hr />
                <button className="account-dropdown-item logout" onClick={() => { logout(); setDropdownOpen(false); }}>
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>

          <button className="btn btn-primary register-btn" onClick={handleRegisterTestDrive}>
            Đăng ký lái thử
          </button>
        </div>
      </div>
    </header>
  );
}
