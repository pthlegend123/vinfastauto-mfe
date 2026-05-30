import { MessageCircle, Video, Camera, Phone, MapPin, Clock } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const aboutLinks = ['Về chúng tôi', 'Cột mốc', 'Cộng đồng VinFast Toàn cầu', 'Báo cáo phát triển bền vững'];
  const serviceLinks = ['Chính sách bảo hành', 'Bảo dưỡng sửa chữa', 'Thiết bị sạc', 'Phụ kiện ô tô'];
  const legalLinks = ['Chính sách giải quyết khiếu nại', 'Chính sách bảo mật', 'Điều khoản sử dụng'];

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
          <div className="footer-support">
            <div><Phone size={15} /> Hotline: <a href="tel:1900232389">1900 23 23 89</a></div>
            <div><Clock size={15} /> Hỗ trợ: 8:00 - 21:00 hằng ngày</div>
            <div><MapPin size={15} /> Showroom: Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ</div>
          </div>
          <div className="social-links">
            <button type="button" className="social-icon" aria-label="Chat VinFast"><MessageCircle size={20} /></button>
            <button type="button" className="social-icon" aria-label="Video VinFast"><Video size={20} /></button>
            <button type="button" className="social-icon" aria-label="Ảnh VinFast"><Camera size={20} /></button>
          </div>
        </div>

        <div className="footer-col">
          <h4>VỀ VINFAST</h4>
          <ul>
            {aboutLinks.map((label) => <li key={label}><span>{label}</span></li>)}
          </ul>
        </div>

        <div className="footer-col">
          <h4>DỊCH VỤ</h4>
          <ul>
            {serviceLinks.map((label) => <li key={label}><span>{label}</span></li>)}
          </ul>
        </div>

        <div className="footer-col">
          <h4>QUY ĐỊNH & PHÁP LÝ</h4>
          <ul>
            {legalLinks.map((label) => <li key={label}><span>{label}</span></li>)}
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
