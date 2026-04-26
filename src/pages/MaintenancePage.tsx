import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { maintenanceService } from '../services/maintenance.service';
import { useAuth } from '../context/AuthContext';
import type {
  MaintenanceServiceType,
  CreateMaintenanceBookingRequest,
} from '../types/maintenance.types';

const SHOWROOMS = [
  'Hà Nội Showroom',
  'TP.HCM Showroom',
  'Đà Nẵng Showroom',
  'Cần Thơ Showroom',
];

const SERVICE_TYPE_LABELS: Record<MaintenanceServiceType, string> = {
  PERIODIC_MAINTENANCE: 'Bảo dưỡng định kỳ',
  REPAIR: 'Sửa chữa',
  INSPECTION: 'Kiểm tra tổng quát',
  TIRE_CHANGE: 'Thay lốp xe',
  BATTERY_CHECK: 'Kiểm tra pin',
};

interface FormState {
  serviceType: MaintenanceServiceType | '';
  showroom: string;
  scheduledDate: string;
  licensePlate: string;
  vin: string;
  mileage: string;
  notes: string;
}

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { isLoggedIn, openLoginModal } = useAuth();

  const [form, setForm] = useState<FormState>({
    serviceType: '',
    showroom: '',
    scheduledDate: '',
    licensePlate: '',
    vin: '',
    mileage: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => navigate('/maintenance'));
    }
  }, [isLoggedIn, openLoginModal, navigate]);

  const getMinDateTime = (): string => {
    const minDate = new Date(Date.now() + 60 * 60 * 1000);
    return minDate.toISOString().slice(0, 16);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.serviceType) {
      setError('Vui lòng chọn loại dịch vụ');
      return;
    }
    if (!form.showroom) {
      setError('Vui lòng chọn showroom');
      return;
    }
    if (!form.scheduledDate) {
      setError('Vui lòng chọn ngày giờ');
      return;
    }

    const selectedDate = new Date(form.scheduledDate);
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
    if (selectedDate < oneHourLater) {
      setError('Ngày giờ đặt lịch phải cách hiện tại ít nhất 1 giờ');
      return;
    }

    const request: CreateMaintenanceBookingRequest = {
      serviceType: form.serviceType as MaintenanceServiceType,
      showroom: form.showroom,
      scheduledDate: new Date(form.scheduledDate).toISOString(),
      licensePlate: form.licensePlate.trim() || undefined,
      vin: form.vin.trim() || undefined,
      mileage: form.mileage ? parseInt(form.mileage, 10) : undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      setSubmitting(true);
      const response = await maintenanceService.bookMaintenance(request);

      if (response.success && response.data) {
        navigate('/my-maintenance');
      } else {
        setError(response.message || 'Không thể đặt lịch bảo dưỡng');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '120px 20px 40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Vui lòng đăng nhập để đặt lịch bảo dưỡng</p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#333',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '100px 20px 60px' }}>
      <button
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#0066cc',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '30px',
        }}
      >
        <ArrowLeft size={20} /> Quay lại
      </button>

      <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#333' }}>
        Đặt lịch bảo dưỡng
      </h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
        Đăng ký dịch vụ bảo dưỡng xe tại các trung tâm dịch vụ VinFast
      </p>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#ffe6e6',
            color: '#cc0000',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label htmlFor="serviceType" style={labelStyle}>
            Loại dịch vụ <span style={{ color: '#cc0000' }}>*</span>
          </label>
          <select
            id="serviceType"
            name="serviceType"
            value={form.serviceType}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">-- Chọn loại dịch vụ --</option>
            {(Object.keys(SERVICE_TYPE_LABELS) as MaintenanceServiceType[]).map((type) => (
              <option key={type} value={type}>
                {SERVICE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="showroom" style={labelStyle}>
            Trung tâm dịch vụ <span style={{ color: '#cc0000' }}>*</span>
          </label>
          <select
            id="showroom"
            name="showroom"
            value={form.showroom}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">-- Chọn trung tâm dịch vụ --</option>
            {SHOWROOMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="scheduledDate" style={labelStyle}>
            Ngày giờ đặt lịch <span style={{ color: '#cc0000' }}>*</span>
          </label>
          <input
            type="datetime-local"
            id="scheduledDate"
            name="scheduledDate"
            value={form.scheduledDate}
            onChange={handleChange}
            min={getMinDateTime()}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={fieldStyle}>
            <label htmlFor="licensePlate" style={labelStyle}>
              Biển số xe
            </label>
            <input
              type="text"
              id="licensePlate"
              name="licensePlate"
              value={form.licensePlate}
              onChange={handleChange}
              placeholder="VD: 51A-12345"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="mileage" style={labelStyle}>
              Số km hiện tại
            </label>
            <input
              type="number"
              id="mileage"
              name="mileage"
              value={form.mileage}
              onChange={handleChange}
              placeholder="VD: 15000"
              min={0}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="vin" style={labelStyle}>
            Số khung xe (VIN)
          </label>
          <input
            type="text"
            id="vin"
            name="vin"
            value={form.vin}
            onChange={handleChange}
            placeholder="17 ký tự"
            maxLength={17}
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="notes" style={labelStyle}>
            Ghi chú thêm
          </label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Mô tả thêm vấn đề của xe hoặc yêu cầu đặc biệt..."
            rows={4}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '14px 20px',
            backgroundColor: submitting ? '#999' : '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '16px',
          }}
        >
          {submitting ? 'Đang xử lý...' : 'Đặt lịch bảo dưỡng'}
        </button>
      </form>
    </div>
  );
}
