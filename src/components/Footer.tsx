import { MessageCircle, Video, Camera } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <div className="footer-logo">
            <svg className="v-logo" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 80L10 20H30L50 50L70 20H90L50 80Z" />
            </svg>
            <span>VINFAST</span>
          </div>
          <p className="company-info">
            Công ty TNHH Kinh doanh Thương mại và Dịch vụ VinFast<br />
            Mã số thuế: 0108926276
          </p>
          <div className="social-links">
            <a href="#" className="social-icon"><MessageCircle size={20} /></a>
            <a href="#" className="social-icon"><Video size={20} /></a>
            <a href="#" className="social-icon"><Camera size={20} /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>VỀ VINFAST</h4>
          <ul>
            <li><a href="#">Về chúng tôi</a></li>
            <li><a href="#">Cột mốc</a></li>
            <li><a href="#">Cộng đồng VinFast Toàn cầu</a></li>
            <li><a href="#">Báo cáo phát triển bền vững</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>DỊCH VỤ</h4>
          <ul>
            <li><a href="#">Chính sách bảo hành</a></li>
            <li><a href="#">Bảo dưỡng sửa chữa</a></li>
            <li><a href="#">Thiết bị sạc</a></li>
            <li><a href="#">Phụ kiện ô tô</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>QUY ĐỊNH & PHÁP LÝ</h4>
          <ul>
            <li><a href="#">Chính sách giải quyết khiếu nại</a></li>
            <li><a href="#">Chính sách bảo mật</a></li>
            <li><a href="#">Điều khoản sử dụng</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} VinFast. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
