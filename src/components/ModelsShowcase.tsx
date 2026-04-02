import { Battery, Users, ArrowRight } from 'lucide-react';
import './ModelsShowcase.css';

const CAR_MODELS = [
  {
    id: 'vf3',
    name: 'VF 3',
    type: 'MiniCar',
    range: '210 km/h',
    seats: 4,
    price: '240.000.000 VNĐ'
  },
  {
    id: 'vf5',
    name: 'VF 5 Plus',
    type: 'A-SUV',
    range: 'OVER 300 km',
    seats: 5,
    price: '468.000.000 VNĐ'
  },
  {
    id: 'vf6',
    name: 'VF 6',
    type: 'B-SUV',
    range: '399 km',
    seats: 5,
    price: '675.000.000 VNĐ'
  },
  {
    id: 'vf7',
    name: 'VF 7',
    type: 'C-SUV',
    range: '431 km',
    seats: 5,
    price: '850.000.000 VNĐ'
  },
  {
    id: 'vf8',
    name: 'VF 8',
    type: 'D-SUV',
    range: '471 km',
    seats: 5,
    price: '1.090.000.000 VNĐ'
  },
  {
    id: 'vf9',
    name: 'VF 9',
    type: 'E-SUV',
    range: '626 km',
    seats: 7,
    price: '1.491.000.000 VNĐ'
  }
];

export default function ModelsShowcase() {
  return (
    <section id="cars" className="models-showcase container">
      <div className="models-header">
        <h2>Dòng Xe VinFast</h2>
        <p>Kiệt tác thiết kế, kiến tạo tương lai</p>
      </div>

      <div className="models-grid">
        {CAR_MODELS.map((car) => (
          <div key={car.id} className="car-card">
            <div className="car-image">
              <img src="/images/vf_model_suv.png" alt={car.name} />
            </div>
            
            <div className="car-details">
              <h3>{car.name}</h3>
              <span className="car-type">{car.type}</span>
              
              <div className="car-specs">
                <div className="spec-item">
                  <Battery size={18} />
                  <span>{car.range}</span>
                </div>
                <div className="spec-item">
                  <Users size={18} />
                  <span>{car.seats} Chỗ</span>
                </div>
              </div>
              
              <div className="car-price">
                <span>Giá từ</span>
                <strong>{car.price}</strong>
              </div>
              
              <div className="car-actions">
                <button className="btn btn-outline">XEM CHI TIẾT</button>
                <button className="btn btn-primary">ĐẶT CỌC <ArrowRight size={16} style={{marginLeft: 8}} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
