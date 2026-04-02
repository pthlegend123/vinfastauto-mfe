import { Menu, User, Globe } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  scrolled: boolean;
}

export default function Header({ scrolled }: HeaderProps) {
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
          <button className="icon-btn hide-mobile">
            <User size={20} />
            <span>Tài khoản</span>
          </button>
          <button className="btn btn-primary register-btn">Đăng ký lái thử</button>
        </div>
      </div>
    </header>
  );
}
