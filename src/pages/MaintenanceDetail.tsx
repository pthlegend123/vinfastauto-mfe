import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { maintenanceService } from '../services/maintenance.service';
import { useAuth } from '../context/AuthContext';
import type { MaintenanceBookingDto, MaintenanceStatus } from '../types/maintenance.types';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  PERIODIC_MAINTENANCE: 'Bảo dưỡng định kỳ',
  REPAIR: 'Sửa chữa',
  INSPECTION: 'Kiểm tra tổng quát',
  TIRE_CHANGE: 'Thay lốp xe',
  BATTERY_CHECK: 'Kiểm tra pin',
};

export default function MaintenanceDetail() {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, openLoginModal } = useAuth();

  const [booking, setBooking] = useState<MaintenanceBookingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => navigate(`/my-maintenance/${bookingCode}`));
    }
  }, [isLoggedIn, openLoginModal, navigate, bookingCode]);

  useEffect(() => {
    if (!isLoggedIn || !bookingCode) return;

    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await maintenanceService.getBookingByCode(bookingCode);

        if (response.code === 200 && response.data) {
          setBooking(response.data);
        } else {
          setError(response.message || 'Không tìm thấy thông tin lịch bảo dưỡng');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [isLoggedIn, bookingCode]);

  const formatDateTime = (dateString: string): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusBadgeStyle = (status: MaintenanceStatus): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      display: 'inline-block',
    };
    switch (status) {
      case 'PENDING':
        return { ...base, backgroundColor: '#fff3cd', color: '#856404' };
      case 'CONFIRMED':
        return { ...base, backgroundColor: '#cfe2ff', color: '#084298' };
      case 'IN_PROGRESS':
        return { ...base, backgroundColor: '#fff0e0', color: '#8a4500' };
      case 'COMPLETED':
        return { ...base, backgroundColor: '#d1e7dd', color: '#0f5132' };
      case 'CANCELLED':
        return { ...base, backgroundColor: '#f8d7da', color: '#842029' };
      default:
        return base;
    }
  };

  const getStatusLabel = (status: MaintenanceStatus): string => {
    const labels: Record<MaintenanceStatus, string> = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      IN_PROGRESS: 'Đang thực hiện',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return labels[status] || status;
  };

  const handleCancel = async () => {
    setSubmitError(null);
    setSuccessMessage(null);

    if (!bookingCode) {
      setSubmitError('Mã lịch bảo dưỡng không hợp lệ');
      return;
    }

    if (!cancellationReason.trim()) {
      setSubmitError('Vui lòng nhập lý do hủy');
      return;
    }

    try {
      setSubmitting(true);
      const response = await maintenanceService.cancelBooking(bookingCode, {
        cancellationReason,
      });

      if (response.code === 200 && response.data) {
        setBooking(response.data);
        setSuccessMessage('Hủy lịch bảo dưỡng thành công');
        setCancellationReason('');
        setShowCancelForm(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setSubmitError(response.message || 'Không thể hủy lịch bảo dưỡng');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '120px 20px 40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Vui lòng đăng nhập để xem chi tiết bảo dưỡng</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '120px 20px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Đang tải thông tin...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ padding: '120px 20px 40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '20px' }}>{error || 'Không tìm thấy lịch bảo dưỡng'}</h2>
        <button
          onClick={() => navigate('/my-maintenance')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '100px 20px 40px' }}>
      <button
        onClick={() => navigate('/my-maintenance')}
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
        <ArrowLeft size={20} /> Quay lại danh sách
      </button>

      <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#333' }}>Chi tiết bảo dưỡng</h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
        Mã lịch: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{booking.bookingCode}</span>
      </p>

      {successMessage && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#e6ffe6',
            color: '#006600',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          {successMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Loại dịch vụ</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>
            {SERVICE_TYPE_LABELS[booking.serviceType] || booking.serviceType}
          </div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Trung tâm dịch vụ</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>{booking.showroom}</div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Ngày giờ hẹn</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>
            {formatDateTime(booking.scheduledDate)}
          </div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Trạng thái</div>
          <span style={getStatusBadgeStyle(booking.status)}>
            {getStatusLabel(booking.status)}
          </span>
        </div>

        {booking.licensePlate && (
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Biển số xe</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>
              {booking.licensePlate}
            </div>
          </div>
        )}

        {booking.mileage !== undefined && booking.mileage !== null && (
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Số km hiện tại</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>
              {booking.mileage.toLocaleString('vi-VN')} km
            </div>
          </div>
        )}

        {booking.vin && (
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Số khung xe (VIN)</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', fontFamily: 'monospace' }}>
              {booking.vin}
            </div>
          </div>
        )}

        {booking.technicianName && (
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Kỹ thuật viên</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>
              {booking.technicianName}
            </div>
          </div>
        )}

        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Ngày đặt lịch</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>
            {formatDateTime(booking.createdAt)}
          </div>
        </div>
      </div>

      {booking.notes && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: '600' }}>
            Ghi chú
          </div>
          <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>{booking.notes}</div>
        </div>
      )}

      {booking.cancellationReason && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            borderRadius: '8px',
            marginBottom: '20px',
            borderLeft: '4px solid #842029',
          }}
        >
          <div style={{ fontSize: '12px', color: '#842029', marginBottom: '8px', fontWeight: '600' }}>
            Lý do hủy
          </div>
          <div style={{ fontSize: '14px', color: '#842029', lineHeight: '1.6' }}>
            {booking.cancellationReason}
          </div>
        </div>
      )}

      {booking.status === 'PENDING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button
            onClick={() => setShowCancelForm(!showCancelForm)}
            style={{
              padding: '12px 20px',
              backgroundColor: '#f8d7da',
              color: '#842029',
              border: '1px solid #f5c6cb',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '16px',
            }}
          >
            {showCancelForm ? 'Đóng' : 'Hủy lịch bảo dưỡng'}
          </button>

          {showCancelForm && (
            <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label
                  htmlFor="cancellationReason"
                  style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}
                >
                  Lý do hủy <span style={{ color: '#cc0000' }}>*</span>
                </label>
                <textarea
                  id="cancellationReason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Vui lòng cho chúng tôi biết lý do hủy lịch..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              {submitError && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#ffe6e6',
                    color: '#cc0000',
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginBottom: '15px',
                  }}
                >
                  {submitError}
                </div>
              )}

              <button
                onClick={handleCancel}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: submitting ? '#999' : '#842029',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                }}
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận hủy lịch'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
