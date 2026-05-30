import { useEffect, useState } from 'react';
import { Building2, X } from 'lucide-react';
import { orderService } from '../services/order.service';
import { useModal } from '../context/ModalContext';
import type { ProductVariant, ProductSku } from '../types/product.types';
import { toCustomerErrorMessage } from '../utils/customerMessages';
import { getRemainingAmount } from '../utils/orderDisplay';
import './OrderModal.css';

const formatPrice = (price?: number) =>
  typeof price === 'number'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
    : 'Liên hệ';

export default function OrderModal() {
  const { orderOpen, orderProduct, closeOrderModal } = useModal();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderOpen || !orderProduct) return;
    const first = orderProduct.variants?.[0] ?? null;
    setSelectedVariant(first);
    setSelectedSku(first?.skus?.[0] ?? null);
    setDepositAmount(first?.price ? String(Math.round(first.price * 0.1)) : '');
    setOrderNote('');
    setOrderError(null);
  }, [orderOpen, orderProduct]);

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setSelectedSku(variant.skus?.[0] ?? null);
    setDepositAmount(variant.price ? String(Math.round(variant.price * 0.1)) : '');
  };

  const validateOrder = (): boolean => {
    if (!selectedSku) {
      setOrderError('Vui lòng chọn màu sắc.');
      return false;
    }

    if (selectedSku.stockQuantity <= 0) {
      setOrderError('Màu xe này hiện đã hết hàng. Vui lòng chọn màu khác.');
      return false;
    }

    const deposit = Number(depositAmount);
    if (!depositAmount || Number.isNaN(deposit) || deposit <= 0) {
      setOrderError('Vui lòng nhập số tiền đặt cọc hợp lệ.');
      return false;
    }

    if (selectedVariant?.price && deposit > selectedVariant.price) {
      setOrderError('Tiền đặt cọc không được lớn hơn giá xe.');
      return false;
    }

    setOrderError(null);
    return true;
  };

  const handleOrderSubmit = async () => {
    if (!validateOrder() || !selectedSku) return;

    const deposit = Number(depositAmount);
    setOrderLoading(true);
    setOrderError(null);

    try {
      const res = await orderService.createOrder({
        sku: selectedSku.sku,
        depositAmount: deposit,
        totalPrice: selectedVariant?.price ?? 0,
        note: orderNote || undefined,
      });

      if ((res.code === 200 || res.code === 201) && res.data) {
        window.location.href = res.data;
      } else {
        setOrderError(toCustomerErrorMessage(res.message, 'Đặt cọc thất bại. Vui lòng thử lại.'));
      }
    } catch (err) {
      setOrderError(toCustomerErrorMessage(err instanceof Error ? err.message : null, 'Không thể tạo đơn đặt cọc. Vui lòng thử lại.'));
    } finally {
      setOrderLoading(false);
    }
  };

  if (!orderOpen || !orderProduct) return null;

  const deposit = Number(depositAmount);
  const displayDeposit = Number.isFinite(deposit) && deposit > 0 ? deposit : 0;
  const remainingAmount = getRemainingAmount(selectedVariant?.price, displayDeposit);
  const selectedSkuAvailable = !!selectedSku && selectedSku.stockQuantity > 0;

  return (
    <div className="order-modal-overlay" onClick={closeOrderModal}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="order-modal-header">
          <h2>Đặt cọc - {orderProduct.name}</h2>
          <button className="order-modal-close" onClick={closeOrderModal} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="order-modal-body">
          {orderProduct.variants && orderProduct.variants.length > 0 && (
            <div className="order-field">
              <label>Chọn phiên bản</label>
              <div className="order-variant-list">
                {orderProduct.variants.map((variant) => (
                  <button
                    key={variant.variantCode}
                    type="button"
                    className={`order-variant-btn${selectedVariant?.variantCode === variant.variantCode ? ' selected' : ''}`}
                    onClick={() => handleVariantSelect(variant)}
                  >
                    <span className="order-variant-name">{variant.variantName}</span>
                    <span className="order-variant-price">{formatPrice(variant.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedVariant?.skus && selectedVariant.skus.length > 0 && (
            <div className="order-field">
              <label>Chọn màu sắc</label>
              <div className="order-sku-list">
                {selectedVariant.skus.map((sku) => (
                  <button
                    key={sku.sku}
                    type="button"
                    className={`order-sku-btn${selectedSku?.sku === sku.sku ? ' selected' : ''}${sku.stockQuantity <= 0 ? ' disabled' : ''}`}
                    onClick={() => setSelectedSku(sku)}
                    title={sku.stockQuantity > 0 ? sku.color?.colorName : `${sku.color?.colorName ?? 'Màu này'} đã hết hàng`}
                  >
                    <span
                      className="order-color-swatch"
                      style={{ backgroundColor: sku.color?.colorHex ?? '#ccc' }}
                    />
                    <span>{sku.color?.colorName ?? 'Không rõ'}</span>
                    <span className={`order-stock-badge${sku.stockQuantity <= 0 ? ' order-stock-badge--out' : ''}`}>
                      {sku.stockQuantity > 0 ? `Còn ${sku.stockQuantity}` : 'Hết hàng'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="order-summary-panel">
            <div className="order-summary-row">
              <span>Xe đã chọn</span>
              <strong>{orderProduct.name}</strong>
            </div>
            <div className="order-summary-row">
              <span>Phiên bản</span>
              <strong>{selectedVariant?.variantName ?? 'Chưa chọn'}</strong>
            </div>
            <div className="order-summary-row">
              <span>Màu sắc</span>
              <strong>{selectedSku?.color?.colorName ?? 'Chưa chọn'}</strong>
            </div>
            <div className="order-summary-row">
              <span>Tình trạng</span>
              <strong className={selectedSkuAvailable ? 'order-summary-ok' : 'order-summary-danger'}>
                {selectedSku ? (selectedSkuAvailable ? `Còn ${selectedSku.stockQuantity} xe` : 'Hết hàng') : 'Chưa chọn màu'}
              </strong>
            </div>
            <div className="order-summary-row">
              <span>Giá xe</span>
              <strong>{formatPrice(selectedVariant?.price)}</strong>
            </div>
            <div className="order-summary-row order-summary-row--deposit">
              <span>Tiền đặt cọc qua VNPay</span>
              <strong>{formatPrice(displayDeposit)}</strong>
            </div>
            <div className="order-summary-row">
              <span>Còn lại sau đặt cọc</span>
              <strong>{remainingAmount !== null ? formatPrice(remainingAmount) : 'Chưa xác định'}</strong>
            </div>
            <p className="order-summary-note">
              Bạn chỉ thanh toán tiền đặt cọc ở bước này, chưa phải toàn bộ giá xe.
            </p>
          </div>

          <div className="order-field">
            <label>Số tiền đặt cọc (VND)</label>
            <input
              type="number"
              className="order-input"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Nhập số tiền đặt cọc"
              min={1}
            />
            {selectedVariant?.price && (
              <span className="order-deposit-hint">
                Gợi ý: {formatPrice(Math.round(selectedVariant.price * 0.1))} (10% giá xe)
              </span>
            )}
          </div>

          <div className="order-field">
            <label>Ghi chú (tùy chọn)</label>
            <textarea
              className="order-input"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="Ghi chú thêm cho đơn hàng..."
              rows={3}
            />
          </div>

          <div className="order-field">
            <label>Phương thức thanh toán</label>
            <div className="order-payment-methods">
              <button type="button" className="order-payment-method-btn selected" aria-pressed="true">
                <span className="order-payment-icon"><Building2 size={22} /></span>
                <span className="order-payment-info">
                  <span className="order-payment-name">VNPay</span>
                  <span className="order-payment-desc">Thanh toán đặt cọc qua cổng VNPay</span>
                </span>
                <span className="order-payment-radio">
                  <span className="order-payment-radio-dot" />
                </span>
              </button>
            </div>
          </div>

          {orderError && <p className="order-error">{orderError}</p>}
        </div>

        <div className="order-modal-footer">
          <button className="btn btn-outline" onClick={closeOrderModal} disabled={orderLoading}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={handleOrderSubmit} disabled={orderLoading || !selectedSkuAvailable}>
            {orderLoading ? 'Đang chuyển sang VNPay...' : 'Thanh toán qua VNPay'}
          </button>
        </div>
      </div>
    </div>
  );
}
