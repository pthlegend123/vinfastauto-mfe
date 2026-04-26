import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, X } from 'lucide-react';
import { orderService } from '../services/order.service';
import { invoiceService } from '../services/invoice.service';
import { useAuth } from '../context/AuthContext';
import type { OrderResponse, OrderStatus } from '../types/order.types';
import type { InvoiceResponse, InvoiceStatus } from '../types/invoice.types';
import './OrderDetail.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_DEPOSIT: 'Chờ đặt cọc',
  DEPOSIT_PAID: 'Đã đặt cọc',
  SALES_CONFIRMED: 'Sales đã xác nhận',
  DELIVERED: 'Đã giao xe',
  CANCELLED: 'Đã hủy',
  REFUND_PENDING: 'Chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
};

const ORDER_BADGE_MOD: Record<OrderStatus, string> = {
  PENDING_DEPOSIT: 'pending-deposit',
  DEPOSIT_PAID: 'deposit-paid',
  SALES_CONFIRMED: 'sales-confirmed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUND_PENDING: 'refund-pending',
  REFUNDED: 'refunded',
};

const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Chờ xử lý',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
};

const CANCELLABLE: OrderStatus[] = ['PENDING_DEPOSIT', 'DEPOSIT_PAID'];

const MAIN_STEPS: OrderStatus[] = [
  'PENDING_DEPOSIT',
  'DEPOSIT_PAID',
  'SALES_CONFIRMED',
  'DELIVERED',
];

const MAIN_STEP_LABELS: Record<string, string> = {
  PENDING_DEPOSIT: 'Chờ đặt cọc',
  DEPOSIT_PAID: 'Đã đặt cọc',
  SALES_CONFIRMED: 'Sales xác nhận',
  DELIVERED: 'Đã giao xe',
};

const CANCELLED_STATES = new Set<OrderStatus>(['CANCELLED', 'REFUND_PENDING', 'REFUNDED']);

// ─── Sub-components ───────────────────────────────────────────────────────────

type StepState = 'done' | 'active' | 'pending' | 'error';

function getStepState(step: OrderStatus, current: OrderStatus): StepState {
  if (CANCELLED_STATES.has(current)) {
    const stepIdx = MAIN_STEPS.indexOf(step);
    return stepIdx === 0 ? 'done' : 'pending';
  }
  const stepIdx = MAIN_STEPS.indexOf(step);
  const currentIdx = MAIN_STEPS.indexOf(current);
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

function getTrackFillPercent(status: OrderStatus): number {
  if (CANCELLED_STATES.has(status)) return 0;
  const idx = MAIN_STEPS.indexOf(status);
  if (idx <= 0) return 0;
  // Track runs between steps: 4 steps → 3 segments
  return (idx / (MAIN_STEPS.length - 1)) * 100;
}

function StatusTimeline({ order }: { order: OrderResponse }) {
  const fillPct = getTrackFillPercent(order.status);
  const isCancelled = CANCELLED_STATES.has(order.status);

  return (
    <div className="od-card">
      <p className="od-card__title">Tiến trình đơn hàng</p>
      <div className="od-timeline">
        <div className="od-timeline__track">
          <div className="od-timeline__track-fill" style={{ width: `${fillPct}%` }} />
        </div>
        {MAIN_STEPS.map((step, idx) => {
          const state = getStepState(step, order.status);
          return (
            <div key={step} className={`od-timeline__step od-timeline__step--${state}`}>
              <div className="od-timeline__dot">{idx + 1}</div>
              <span className="od-timeline__label">{MAIN_STEP_LABELS[step]}</span>
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <div className="od-timeline-error">
          <X size={14} />
          {ORDER_STATUS_LABELS[order.status]}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateStr?: string) =>
  dateStr
    ? new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(dateStr))
    : '—';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// ─── Page ────────────────────────────────────────────────────────────────────

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

  const fetchOrder = useCallback(async () => {
    if (!orderCode) return;
    try {
      setLoading(true);
      setError(null);
      const orderRes = await orderService.getOrderByCode(orderCode);
      if (orderRes.code === 200 && orderRes.data) {
        setOrder(orderRes.data);
      } else {
        setError(orderRes.message || 'Không tìm thấy đơn hàng');
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }

    try {
      const invoiceRes = await invoiceService.getInvoicesByOrder(orderCode);
      if (invoiceRes.code === 200 && invoiceRes.data) {
        setInvoices(Array.isArray(invoiceRes.data) ? invoiceRes.data : []);
      }
    } catch {
      // invoice fetch failure is non-fatal
    }
  }, [orderCode]);

  useEffect(() => {
    if (!isLoggedIn || !orderCode) return;
    fetchOrder();
  }, [isLoggedIn, orderCode, fetchOrder]);

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

  // ── Guard states ──

  if (!isLoggedIn) {
    return (
      <div className="od-state-center">
        <p>Vui lòng đăng nhập để xem đơn hàng.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="od-state-center">
        Đang tải thông tin đơn hàng...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="od-state-center">
        <p style={{ color: '#cc0000' }}>{error || 'Không tìm thấy đơn hàng'}</p>
        <button className="od-btn od-btn--outline" onClick={() => navigate('/my-orders')}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const badgeMod = ORDER_BADGE_MOD[order.status];

  return (
    <div className="od-container">
      {/* Back */}
      <button className="od-back" onClick={() => navigate('/my-orders')}>
        <ArrowLeft size={18} />
        Đơn hàng của tôi
      </button>

      {/* Header */}
      <div className="od-header">
        <div>
          <h1 className="od-header__title">Chi tiết đơn hàng</h1>
          <p className="od-header__code">{order.orderCode}</p>
        </div>
        <span className={`od-badge od-badge--${badgeMod}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Alerts */}
      {successMsg && <div className="od-alert od-alert--success">{successMsg}</div>}
      {error && <div className="od-alert od-alert--error">{error}</div>}

      {/* Status Timeline */}
      <StatusTimeline order={order} />

      {/* Financial Summary */}
      <div className="od-card">
        <p className="od-card__title">Tóm tắt tài chính</p>
        <div className="od-summary">
          <div className="od-summary__item od-summary__item--highlight">
            <div className="od-summary__item__label">Tiền đặt cọc</div>
            <div className="od-summary__item__value">{formatCurrency(order.depositAmount)}</div>
          </div>
          <div className="od-summary__item">
            <div className="od-summary__item__label">Giá trị xe</div>
            <div className="od-summary__item__value">
              {order.totalPrice > 0 ? formatCurrency(order.totalPrice) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="od-card">
        <p className="od-card__title">Thông tin đơn hàng</p>

        <div className="od-field">
          <span className="od-field__label">Sản phẩm</span>
          <span className="od-field__value">{order.productName || order.sku}</span>
        </div>
        <div className="od-field">
          <span className="od-field__label">Ngày tạo đơn</span>
          <span className="od-field__value">{formatDate(order.createdAt)}</span>
        </div>
        {order.updatedAt && (
          <div className="od-field">
            <span className="od-field__label">Cập nhật lần cuối</span>
            <span className="od-field__value">{formatDate(order.updatedAt)}</span>
          </div>
        )}
        {order.testDriveDate && (
          <div className="od-field">
            <span className="od-field__label">Ngày lái thử</span>
            <span className="od-field__value">{formatDate(order.testDriveDate)}</span>
          </div>
        )}
        {order.handoverDate && (
          <div className="od-field">
            <span className="od-field__label">Ngày bàn giao xe</span>
            <span className="od-field__value">{formatDate(order.handoverDate)}</span>
          </div>
        )}
      </div>

      {/* Assigned Employee */}
      {order.assignedEmployeeName && (
        <div className="od-card">
          <p className="od-card__title">Nhân viên phụ trách</p>
          <div className="od-employee">
            <div className="od-employee__avatar">
              {order.assignedEmployeeName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="od-employee__name">{order.assignedEmployeeName}</div>
              {order.assignedEmployeeCode && (
                <div className="od-employee__code">{order.assignedEmployeeCode}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoices — always visible */}
      <div className="od-card">
        <p className="od-card__title">
          Hóa đơn {invoices.length > 0 ? `(${invoices.length})` : ''}
        </p>
        {invoices.length === 0 ? (
          <div className="od-empty-state">
            <FileText size={32} />
            <p>Chưa có hóa đơn nào</p>
          </div>
        ) : (
          <div className="od-table-wrap">
            <table className="od-table">
              <thead>
                <tr>
                  <th>Mã hóa đơn</th>
                  <th>Loại</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.invoiceCode}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{inv.invoiceCode}</td>
                    <td>{inv.invoiceType}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatCurrency(inv.amount)}</td>
                    <td>{inv.paymentMethod}</td>
                    <td>
                      <span className={`od-inv-badge od-inv-badge--${inv.status.toLowerCase()}`}>
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(inv.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Section */}
      {CANCELLABLE.includes(order.status) && (
        <div className="od-cancel-card">
          {!showCancelForm ? (
            <div className="od-cancel-row">
              <div>
                <p className="od-cancel-title">Hủy đơn hàng</p>
                <p className="od-cancel-hint">Bạn có thể hủy đơn khi chưa hoàn tất đặt cọc</p>
              </div>
              <button className="od-btn od-btn--danger" onClick={() => setShowCancelForm(true)}>
                <X size={16} />
                Hủy đơn
              </button>
            </div>
          ) : (
            <div className="od-cancel-form">
              <p className="od-cancel-form__label">Nhập lý do hủy đơn</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Lý do hủy đơn..."
                rows={3}
              />
              <div className="od-actions">
                <button
                  className="od-btn od-btn--outline"
                  onClick={() => {
                    setShowCancelForm(false);
                    setCancelReason('');
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  className="od-btn od-btn--danger"
                  onClick={handleCancel}
                  disabled={!cancelReason.trim() || cancelling}
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
