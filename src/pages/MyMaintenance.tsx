import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Plus } from 'lucide-react';
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

export default function MyMaintenance() {
  const navigate = useNavigate();
  const { isLoggedIn, openLoginModal } = useAuth();

  const [bookings, setBookings] = useState<MaintenanceBookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => navigate('/my-maintenance'));
    }
  }, [isLoggedIn, openLoginModal, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await maintenanceService.getMyBookings();

        if (response.success && response.data) {
          setBookings(Array.isArray(response.data) ? response.data : []);
        } else {
          setError(response.message || 'Không thể tải danh sách lịch bảo dưỡng');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isLoggedIn]);

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
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
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

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '120px 20px 40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Vui lòng đăng nhập để xem lịch sử bảo dưỡng</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '120px 20px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Đang tải danh sách bảo dưỡng...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 20px 40px' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#333' }}>Lịch sử bảo dưỡng</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Quản lý các lịch bảo dưỡng xe của bạn
          </p>
        </div>
        <button
          onClick={() => navigate('/maintenance')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0066cc',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <Plus size={16} /> Đặt lịch mới
        </button>
      </div>

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

      {bookings.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <p style={{ color: '#666', marginBottom: '20px' }}>Bạn chưa có lịch bảo dưỡng nào</p>
          <button
            onClick={() => navigate('/maintenance')}
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
            Đặt lịch bảo dưỡng
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  Mã lịch
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  Loại dịch vụ
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  Trung tâm
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  Ngày giờ
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  Trạng thái
                </th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#333' }}>
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <tr
                  key={booking.bookingCode}
                  style={{
                    borderBottom: '1px solid #ddd',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                  }}
                >
                  <td style={{ padding: '15px', color: '#333', fontFamily: 'monospace', fontSize: '13px' }}>
                    {booking.bookingCode}
                  </td>
                  <td style={{ padding: '15px', color: '#333' }}>
                    {SERVICE_TYPE_LABELS[booking.serviceType] || booking.serviceType}
                  </td>
                  <td style={{ padding: '15px', color: '#333' }}>{booking.showroom}</td>
                  <td style={{ padding: '15px', color: '#333' }}>
                    {formatDateTime(booking.scheduledDate)}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={getStatusBadgeStyle(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button
                      onClick={() => navigate(`/my-maintenance/${booking.bookingCode}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#0066cc',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      <Eye size={16} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
