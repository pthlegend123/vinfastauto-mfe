import './Promotions.css';

export default function Promotions() {
  return (
    <section id="charging" className="promotions">
      <div className="promo-panel">
        <div className="promo-image">
          {/* using hero background as placeholder or a solid gradient for now */}
          <div className="placeholder-image bg-gradient-1"></div>
        </div>
        <div className="promo-content bg-blue">
          <h2>Hệ Sinh Thái Toàn Diện</h2>
          <p>
            Trạm sạc phủ khắp mọi miền cùng dịch vụ hậu mãi xuất sắc. VinFast cam kết đồng hành cùng bạn trên mọi hành trình với hàng ngàn trạm sạc đang được triển khai trên cả nước.
          </p>
          <button className="btn btn-outline-white">KHÁM PHÁ NGAY</button>
        </div>
      </div>
      
      <div id="services" className="promo-panel reverse">
        <div className="promo-image">
          <div className="placeholder-image bg-gradient-2"></div>
        </div>
        <div className="promo-content bg-light">
          <h2 className="text-dark">Dịch Vụ Hậu Mãi Chu Đáo</h2>
          <p className="text-dark">
            Bảo hành lên đến 10 năm hoặc 200.000km, dịch vụ cứu hộ 24/7 và sửa chữa lưu động mang lại sự an tâm tuyệt đối cho khách hàng.
          </p>
          <button className="btn btn-outline">TÌM HIỂU DỊCH VỤ</button>
        </div>
      </div>
    </section>
  );
}
