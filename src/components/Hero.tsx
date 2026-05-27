import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

export default function Hero() {
  const navigate = useNavigate();
  const { isLoggedIn, openLoginModal } = useAuth();

  const handleRegisterTestDrive = () => {
    if (!isLoggedIn) {
      openLoginModal(() => navigate('/my-test-drives'));
    } else {
      navigate('/my-test-drives');
    }
  };

  const handleLearnMore = () => {
    document.getElementById('models-showcase')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="about" className="hero">
      <div className="hero-background">
        <img src="/images/hero_ev_background.jpg" alt="VinFast Hero Background" />
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content container">
        <div className="hero-text">
          <h1 className="hero-title">MÃNH LIỆT VÌ TƯƠNG LAI XANH</h1>
          <p className="hero-subtitle">Mẫu xe điện tiên phong với thiết kế đẳng cấp và công nghệ vượt trội.</p>
        </div>

        <div className="hero-actions">
          <button className="btn btn-outline-white" onClick={handleRegisterTestDrive}>ĐĂNG KÝ LÁI THỬ</button>
          <button className="btn btn-primary" onClick={handleLearnMore}>TÌM HIỂU THÊM</button>
        </div>
      </div>
      
      <div className="hero-scroll-indicator">
        <div className="mouse"></div>
      </div>
    </section>
  );
}
