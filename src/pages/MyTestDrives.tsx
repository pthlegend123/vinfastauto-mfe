import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import { testDriveService } from '../services/testDrive.service';
import { useAuth } from '../context/AuthContext';
import type { TestDriveDto } from '../types/testDrive.types';

export default function MyTestDrives() {
  const navigate = useNavigate();
  const { isLoggedIn, openLoginModal } = useAuth();

  const [bookings, setBookings] = useState<TestDriveDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => navigate('/my-test-drives'));
    }
  }, [isLoggedIn, openLoginModal, navigate]);

  // Fetch bookings
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await testDriveService.getCustomerBookings();

        if (response.code === 200 && response.data) {
          setBookings(Array.isArray(response.data) ? response.data : []);
        } else {
          setError(response.message || 'Không thể tải danh sách lái thử');
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block',
    };

    switch (status) {
      case 'PENDING':
        return {
          ...baseStyle,
          backgroundColor: '#fff3cd',
          color: '#856404',
        };
      case 'CONFIRMED':
        return {
          ...baseStyle,
          backgroundColor: '#cfe2ff',
          color: '#084298',
        };
      case 'COMPLETED':
        return {
          ...baseStyle,
          backgroundColor: '#d1e7dd',
          color: '#0f5132',
        };
      case 'CANCELLED':
        return {
          ...baseStyle,
          backgroundColor: '#f8d7da',
          color: '#842029',
        };
      default:
        return baseStyle;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return labels[status] || status;
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Vui lòng đăng nhập để xem lịch sử lái thử</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Đang tải danh sách lái thử...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <button
        onClick={() => navigate(-1)}
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

      <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#333' }}>Lịch sử lái thử</h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
        Quản lý các cuộc lái thử của bạn
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

      {bookings.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <p style={{ color: '#666', marginBottom: '20px' }}>Bạn chưa có cuộc lái thử nào</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ padding: '10px 20px' }}
          >
            Khám phá sản phẩm
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#fff',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  Sản phẩm
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  Ngày giờ
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  Địa điểm
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
                  key={booking.testDriveCode}
                  style={{
                    borderBottom: '1px solid #ddd',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                  }}
                >
                  <td style={{ padding: '15px', color: '#333' }}>
                    <div style={{ fontWeight: '500' }}>{booking.productCode}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{booking.variantCode || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '15px', color: '#333' }}>
                    {formatDateTime(booking.scheduledDate)}
                  </td>
                  <td style={{ padding: '15px', color: '#333' }}>{booking.location}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={getStatusBadgeStyle(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button
                      onClick={() => navigate(`/my-test-drives/${booking.testDriveCode}`)}
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
