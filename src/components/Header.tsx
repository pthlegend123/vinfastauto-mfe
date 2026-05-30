import { Menu, User, Globe, LogOut, ChevronDown, Bell, ShoppingBag, Bike, Wrench, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { notificationService } from '../services/notification.service';
import type { NotificationDto } from '../types/notification.types';
import './Header.css';

interface HeaderProps {
  scrolled: boolean;
}

function formatNotifDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  return d.toLocaleDateString('vi-VN');
}

export default function Header({ scrolled }: HeaderProps) {
  const { isLoggedIn, user, logout, openLoginModal } = useAuth();
  const { openTestDriveModal } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res.code === 200 && res.data) {
        setUnreadCount(res.data.count);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [isLoggedIn, fetchUnreadCount]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleBellClick = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (!opening) return;

    setNotifLoading(true);
    try {
      const res = await notificationService.getNotifications();
      if (res.code === 200 && res.data) {
        setNotifications(res.data);
      }
      // Mark all as read after opening
      await notificationService.markAllAsRead();
      setUnreadCount(0);
    } catch {
      // silently ignore
    } finally {
      setNotifLoading(false);
    }
  };

  const handleAccountClick = () => {
    if (isLoggedIn) {
      setDropdownOpen(v => !v);
    } else {
      openLoginModal();
    }
  };

  const handleNavClick = (sectionId: string) => {
    if (isHomePage) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  const handleRegisterTestDrive = () => {
    if (!isLoggedIn) {
      openLoginModal(() => openTestDriveModal());
    } else {
      openTestDriveModal();
    }
    setMobileMenuOpen(false);
  };

  const navigateFromMobile = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleMobileAccountClick = () => {
    if (isLoggedIn) {
      navigateFromMobile('/profile');
    } else {
      openLoginModal();
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className={`header ${scrolled || !isHomePage ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Mobile Menu Icon */}
        <button
          className="icon-btn mobile-menu"
          aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <a href="/" className="logo">
          <svg className="v-logo" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 80L10 20H30L50 50L70 20H90L50 80Z" />
          </svg>
          <span className="logo-text">VINFAST</span>
        </a>

        {/* Navigation - Desktop (home page only) */}
        {isHomePage && (
          <nav className="desktop-nav">
            <ul>
              <li><button onClick={() => handleNavClick('about')}>Giới thiệu</button></li>
              <li><button onClick={() => handleNavClick('cars')}>Ô tô</button></li>
              <li><button onClick={() => handleNavClick('ebikes')}>Xe máy điện</button></li>
              <li><button onClick={() => handleNavClick('services')}>Dịch vụ hậu mãi</button></li>
              <li><button onClick={() => navigate('/maintenance')}>Bảo dưỡng</button></li>
              <li><button onClick={() => handleNavClick('charging')}>Pin và trạm sạc</button></li>
            </ul>
          </nav>
        )}

        {/* Right Actions */}
        <div className="header-actions">
          <button className="icon-btn hide-mobile">
            <Globe size={20} />
            <span>VN</span>
          </button>

          {/* Notification Bell */}
          {isLoggedIn && (
            <div className="notif-wrapper hide-mobile" ref={notifRef} style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                onClick={handleBellClick}
                style={{ position: 'relative' }}
                title="Thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#e53e3e',
                    color: '#fff',
                    borderRadius: '50%',
                    fontSize: '10px',
                    fontWeight: '700',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '320px',
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 1000,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>Thông báo</span>
                  </div>

                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {notifLoading ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>Đang tải...</div>
                    ) : notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>Không có thông báo</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f5f5f5',
                            backgroundColor: n.isReaded ? '#fff' : '#f0f7ff',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            if (n.notificationType === 'ORDER') navigate('/my-orders');
                            else if (n.notificationType === 'MAINTENANCE') navigate('/my-maintenance');
                            else navigate('/my-test-drives');
                            setNotifOpen(false);
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ marginTop: '2px', flexShrink: 0 }}>
                              {n.notificationType === 'ORDER'
                                ? <ShoppingBag size={16} color="#0066cc" />
                                : n.notificationType === 'MAINTENANCE'
                                  ? <Wrench size={16} color="#cc7700" />
                                  : <Bike size={16} color="#0a9e50" />
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '3px' }}>{n.title}</div>
                              <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4', wordBreak: 'break-word' }}>{n.message}</div>
                              <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>{formatNotifDate(n.createdAt)}</div>
                            </div>
                            {!n.isReaded && (
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0066cc', flexShrink: 0, marginTop: '4px' }} />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
                <button
                  className="account-dropdown-item"
                  onClick={() => {
                    navigate('/my-orders');
                    setDropdownOpen(false);
                  }}
                >
                  Đơn hàng của tôi
                </button>
                <button
                  className="account-dropdown-item"
                  onClick={() => {
                    navigate('/my-test-drives');
                    setDropdownOpen(false);
                  }}
                >
                  Lịch sử lái thử
                </button>
                <button
                  className="account-dropdown-item"
                  onClick={() => {
                    navigate('/my-maintenance');
                    setDropdownOpen(false);
                  }}
                >
                  Bảo dưỡng xe
                </button>
                <button
                  className="account-dropdown-item"
                  onClick={() => {
                    navigate('/profile');
                    setDropdownOpen(false);
                  }}
                >
                  Hồ sơ của tôi
                </button>
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
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer__section">
            <button onClick={() => navigateFromMobile('/')}>Trang chủ</button>
            <button onClick={() => { handleNavClick('cars'); setMobileMenuOpen(false); }}>Ô tô</button>
            <button onClick={() => { handleNavClick('ebikes'); setMobileMenuOpen(false); }}>Xe máy điện</button>
            <button onClick={() => navigateFromMobile('/maintenance')}>Bảo dưỡng</button>
          </div>
          <div className="mobile-drawer__section">
            <button onClick={handleMobileAccountClick}>
              {isLoggedIn ? (user?.customer?.fullName || 'Tài khoản') : 'Đăng nhập'}
            </button>
            {isLoggedIn && (
              <>
                <button onClick={() => navigateFromMobile('/profile')}>Hồ sơ của tôi</button>
                <button onClick={() => navigateFromMobile('/my-orders')}>Đơn hàng của tôi</button>
                <button onClick={() => navigateFromMobile('/my-test-drives')}>Lịch lái thử</button>
                <button onClick={() => navigateFromMobile('/my-maintenance')}>Lịch bảo dưỡng</button>
                <button
                  className="mobile-drawer__logout"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
