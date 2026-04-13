import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { orderService } from '../services/order.service';
import { invoiceService } from '../services/invoice.service';
import { useAuth } from '../context/AuthContext';
import type { OrderResponse, OrderStatus } from '../types/order.types';
import type { InvoiceResponse } from '../types/invoice.types';

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

const INVOICE_STATUS_COLORS: Record<string, React.CSSProperties> = {
  PENDING: { backgroundColor: '#fff3cd', color: '#856404' },
  PAID: { backgroundColor: '#d1e7dd', color: '#0f5132' },
  CANCELLED: { backgroundColor: '#f8d7da', color: '#842029' },
};

const BADGE_BASE: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '600',
  display: 'inline-block',
};

const CANCELLABLE: OrderStatus[] = ['PENDING_DEPOSIT', 'DEPOSIT_PAID'];

export default function OrderDetail() {
  const navigate = useNavigate();
  const { orderCode } = useParams<{ orderCode: string }>();
  const { isLoggedIn, openLoginModal } = useAuth();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => navigate(`/my-orders/${orderCode}`));
    }
  }, [isLoggedIn, openLoginModal, navigate, orderCode]);

  useEffect(() => {
    if (!isLoggedIn || !orderCode) return;
    fetchOrder();
  }, [isLoggedIn, orderCode]);

  const fetchOrder = async () => {
    if (!orderCode) return;
    try {
      setLoading(true);
      setError(null);
      const [orderRes, invoiceRes] = await Promise.all([
        orderService.getOrderByCode(orderCode),
        invoiceService.getInvoicesByOrder(orderCode),
      ]);
      if (orderRes.code === 200 && orderRes.data) {
        setOrder(orderRes.data);
      } else {
        setError(orderRes.message || 'Không tìm thấy đơn hàng');
      }
      if (invoiceRes.code === 200 && invoiceRes.data) {
        setInvoices(Array.isArray(invoiceRes.data) ? invoiceRes.data : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!orderCode || !cancelReason.trim()) return;
    try {
      setCancelling(true);
      const response = await orderService.cancelOrder(orderCode, { reason: cancelReason });
      if (response.code === 200 && response.data) {
        setOrder(response.data);
        setShowCancelForm(false);
        setCancelReason('');
        setSuccessMsg('Hủy đơn hàng thành công');
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

  const formatDate = (dateStr?: string) =>
    dateStr
      ? new Intl.DateTimeFormat('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(dateStr))
      : '—';

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px',
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Vui lòng đăng nhập</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
        Đang tải thông tin đơn hàng...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#cc0000' }}>{error || 'Không tìm thấy đơn hàng'}</p>
        <button
          onClick={() => navigate('/my-orders')}
          style={{ marginTop: '16px', padding: '10px 20px', cursor: 'pointer' }}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <button
        onClick={() => navigate('/my-orders')}
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
        <ArrowLeft size={20} /> Đơn hàng của tôi
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 4px', color: '#333' }}>Chi tiết đơn hàng</h1>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{order.orderCode}</p>
        </div>
        <span style={{ ...BADGE_BASE, fontSize: '14px', padding: '6px 14px', ...ORDER_STATUS_COLORS[order.status] }}>
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {successMsg && (
        <div style={{ padding: '12px', backgroundColor: '#d1e7dd', color: '#0f5132', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px', backgroundColor: '#ffe6e6', color: '#cc0000', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Order Info */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>Thông tin đơn hàng</h2>
        <div style={fieldStyle}>
          <span style={{ color: '#666' }}>Sản phẩm</span>
          <span style={{ fontWeight: '500', color: '#333' }}>{order.productName || order.skuCode}</span>
        </div>
        <div style={fieldStyle}>
          <span style={{ color: '#666' }}>Phiên bản</span>
          <span style={{ color: '#333' }}>{order.variantName || '—'}</span>
        </div>
        <div style={fieldStyle}>
          <span style={{ color: '#666' }}>Màu sắc</span>
          <span style={{ color: '#333' }}>{order.colorName || '—'}</span>
        </div>
        <div style={fieldStyle}>
          <span style={{ color: '#666' }}>Số tiền đặt cọc</span>
          <span style={{ fontWeight: '600', color: '#0066cc' }}>{formatCurrency(order.depositAmount)}</span>
        </div>
        {order.totalPrice > 0 && (
          <div style={fieldStyle}>
            <span style={{ color: '#666' }}>Tổng giá trị</span>
            <span style={{ fontWeight: '600', color: '#333' }}>{formatCurrency(order.totalPrice)}</span>
          </div>
        )}
        <div style={fieldStyle}>
          <span style={{ color: '#666' }}>Nhân viên phụ trách</span>
          <span style={{ color: '#333' }}>{order.assignedEmployeeCode || 'Chưa phân công'}</span>
        </div>
        <div style={fieldStyle}>
          <span style={{ color: '#666' }}>Ngày tạo đơn</span>
          <span style={{ color: '#333' }}>{formatDate(order.createdAt)}</span>
        </div>
        {order.testDriveDate && (
          <div style={fieldStyle}>
            <span style={{ color: '#666' }}>Ngày lái thử</span>
            <span style={{ color: '#333' }}>{formatDate(order.testDriveDate)}</span>
          </div>
        )}
        {order.handoverDate && (
          <div style={{ ...fieldStyle, borderBottom: 'none' }}>
            <span style={{ color: '#666' }}>Ngày bàn giao xe</span>
            <span style={{ color: '#333' }}>{formatDate(order.handoverDate)}</span>
          </div>
        )}
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>Hóa đơn ({invoices.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  {['Mã hóa đơn', 'Loại', 'Số tiền', 'Phương thức', 'Trạng thái', 'Ngày tạo'].map(h => (
                    <th key={h} style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.invoiceCode} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px', fontSize: '12px', fontFamily: 'monospace', color: '#333' }}>{inv.invoiceCode}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#333' }}>{inv.invoiceType}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#333', whiteSpace: 'nowrap' }}>{formatCurrency(inv.amount)}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#555' }}>{inv.paymentMethod}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ ...BADGE_BASE, ...(INVOICE_STATUS_COLORS[inv.status] || {}) }}>
                        {inv.status === 'PAID' ? 'Đã thanh toán' : inv.status === 'PENDING' ? 'Chờ xử lý' : 'Đã hủy'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#555', whiteSpace: 'nowrap' }}>{formatDate(inv.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Section */}
      {CANCELLABLE.includes(order.status) && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #f5c6cb', borderRadius: '12px', padding: '24px' }}>
          {!showCancelForm ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>Hủy đơn hàng</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Chỉ có thể hủy khi chưa hoàn tất đặt cọc</p>
              </div>
              <button
                onClick={() => setShowCancelForm(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                <X size={16} /> Hủy đơn
              </button>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#333' }}>Nhập lý do hủy đơn</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Lý do hủy đơn..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => { setShowCancelForm(false); setCancelReason(''); }}
                  style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' }}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason.trim() || cancelling}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: !cancelReason.trim() || cancelling ? '#ccc' : '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: !cancelReason.trim() || cancelling ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
