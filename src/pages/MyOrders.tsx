import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, X } from 'lucide-react';
import { orderService } from '../services/order.service';
import { useAuth } from '../context/AuthContext';
import type { OrderResponse, OrderStatus } from '../types/order.types';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_DEPOSIT: 'Chờ đặt cọc',
  DEPOSIT_PAID: 'Đã đặt cọc',
  SALES_CONFIRMED: 'Sales đã xác nhận',
  DELIVERED: 'Đã giao xe',
  CANCELLED: 'Đã hủy',
  REFUND_PENDING: 'Chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
};

const ORDER_STATUS_COLORS: Record<OrderStatus, React.CSSProperties> = {
  PENDING_DEPOSIT: { backgroundColor: '#fff3cd', color: '#856404' },
  DEPOSIT_PAID: { backgroundColor: '#cfe2ff', color: '#084298' },
  SALES_CONFIRMED: { backgroundColor: '#e9d5ff', color: '#6b21a8' },
  DELIVERED: { backgroundColor: '#d1e7dd', color: '#0f5132' },
  CANCELLED: { backgroundColor: '#f8d7da', color: '#842029' },
  REFUND_PENDING: { backgroundColor: '#ffe0b2', color: '#e65100' },
  REFUNDED: { backgroundColor: '#b2dfdb', color: '#00695c' },
};

const BADGE_BASE: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '600',
  display: 'inline-block',
  whiteSpace: 'nowrap',
};

const CANCELLABLE: OrderStatus[] = ['PENDING_DEPOSIT', 'DEPOSIT_PAID'];

interface CancelModal {
  orderCode: string;
  reason: string;
}

export default function MyOrders() {
  const navigate = useNavigate();
  const { isLoggedIn, openLoginModal } = useAuth();

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [cancelModal, setCancelModal] = useState<CancelModal | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const SIZE = 10;

  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => navigate('/my-orders'));
    }
  }, [isLoggedIn, openLoginModal, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchOrders();
  }, [isLoggedIn, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getMyOrders(page, SIZE);
      if (response.code === 200 && response.data) {
        setOrders(response.data.content);
        setTotalPages(response.data.totalPages);
      } else {
        setError(response.message || 'Không thể tải danh sách đơn hàng');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal || !cancelModal.reason.trim()) return;
    try {
      setCancelling(true);
      const response = await orderService.cancelOrder(cancelModal.orderCode, {
        reason: cancelModal.reason,
      });
      if (response.code === 200) {
        setSuccessMsg('Hủy đơn hàng thành công');
        setCancelModal(null);
        fetchOrders();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(response.message || 'Không thể hủy đơn hàng');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateStr));

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '120px 20px 40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Vui lòng đăng nhập để xem đơn hàng</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '100px 20px 40px' }}>
      <button
        onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
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

      <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#333' }}>Đơn hàng của tôi</h1>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
        Quản lý các đơn đặt xe của bạn
      </p>

      {successMsg && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#d1e7dd',
            color: '#0f5132',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          {successMsg}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#ffe6e6',
            color: '#cc0000',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          Đang tải đơn hàng...
        </div>
      ) : orders.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <p style={{ color: '#666', marginBottom: '20px' }}>Bạn chưa có đơn hàng nào</p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Khám phá sản phẩm
          </button>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  {['Mã đơn', 'Sản phẩm', 'Phiên bản', 'Màu', 'Đặt cọc', 'Trạng thái', 'Ngày tạo', 'Hành động'].map(h => (
                    <th key={h} style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '600', color: '#333', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr
                    key={order.orderCode}
                    style={{
                      borderBottom: '1px solid #ddd',
                      backgroundColor: i % 2 === 0 ? '#fff' : '#f9f9f9',
                    }}
                  >
                    <td style={{ padding: '12px 15px', color: '#333', fontSize: '13px', fontFamily: 'monospace' }}>
                      {order.orderCode}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#333', fontSize: '13px' }}>
                      {order.productName || order.sku}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#555', fontSize: '13px' }}>
                      {'—'}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#555', fontSize: '13px' }}>
                      {order.colorName || '—'}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#333', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {formatCurrency(order.depositAmount)}
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ ...BADGE_BASE, ...ORDER_STATUS_COLORS[order.status] }}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 15px', color: '#555', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => navigate(`/my-orders/${order.orderCode}`)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#0066cc',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Eye size={14} /> Chi tiết
                        </button>
                        {CANCELLABLE.includes(order.status) && (
                          <button
                            onClick={() => setCancelModal({ orderCode: order.orderCode, reason: '' })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <X size={14} /> Hủy đơn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                marginTop: '24px',
              }}
            >
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: page === 0 ? '#f5f5f5' : '#fff',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                  color: page === 0 ? '#999' : '#333',
                }}
              >
                Trước
              </button>
              <span style={{ color: '#555', fontSize: '14px' }}>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: page >= totalPages - 1 ? '#f5f5f5' : '#fff',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  color: page >= totalPages - 1 ? '#999' : '#333',
                }}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              width: '100%',
              maxWidth: '480px',
              margin: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 8px', color: '#333', fontSize: '20px' }}>Hủy đơn hàng</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              Mã đơn: <strong>{cancelModal.orderCode}</strong>
            </p>
            <textarea
              value={cancelModal.reason}
              onChange={e => setCancelModal({ ...cancelModal, reason: e.target.value })}
              placeholder="Nhập lý do hủy đơn..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCancelModal(null)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Đóng
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={!cancelModal.reason.trim() || cancelling}
                style={{
                  padding: '10px 20px',
                  backgroundColor: !cancelModal.reason.trim() || cancelling ? '#ccc' : '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !cancelModal.reason.trim() || cancelling ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
