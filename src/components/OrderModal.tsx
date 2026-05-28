import { useEffect, useState } from 'react';
import { X, CreditCard, Building2 } from 'lucide-react';
import { orderService } from '../services/order.service';
import { useModal } from '../context/ModalContext';
import type { ProductVariant, ProductSku } from '../types/product.types';
import CardPaymentModal from './CardPaymentModal';
import './OrderModal.css';

type PaymentMethod = 'BANK_CARD' | 'VNPAY';

const formatPrice = (price?: number) =>
  price
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_CARD');
  const [showCardModal, setShowCardModal] = useState(false);

  useEffect(() => {
    if (!orderOpen || !orderProduct) return;
    const first = orderProduct.variants?.[0] ?? null;
    setSelectedVariant(first);
    setSelectedSku(first?.skus?.[0] ?? null);
    setDepositAmount(first?.price ? String(Math.round(first.price * 0.1)) : '');
    setOrderNote('');
    setOrderError(null);
    setPaymentMethod('BANK_CARD');
    setShowCardModal(false);
  }, [orderOpen, orderProduct]);

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setSelectedSku(variant.skus?.[0] ?? null);
    setDepositAmount(variant.price ? String(Math.round(variant.price * 0.1)) : '');
  };

  const validateStep1 = (): boolean => {
    if (!selectedSku) { setOrderError('Vui lòng chọn màu sắc.'); return false; }
    const deposit = Number(depositAmount);
    if (!depositAmount || isNaN(deposit) || deposit <= 0) {
      setOrderError('Vui lòng nhập số tiền đặt cọc hợp lệ.'); return false;
    }
    setOrderError(null);
    return true;
  };

  const handleContinue = () => {
    if (!validateStep1()) return;
    if (paymentMethod === 'BANK_CARD') {
      setShowCardModal(true);
    } else {
      // VNPay: submit directly (placeholder — VNPay integration TBD)
      handleOrderSubmit();
    }
  };

  const handleOrderSubmit = async () => {
    if (!selectedSku) return;
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
      if (res.code === 200 || res.code === 201) {
        window.location.href = res.data;
      } else {
        setOrderError(res.message || 'Đặt cọc thất bại. Vui lòng thử lại.');
        setShowCardModal(false);
      }
    } catch {
      setOrderError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      setShowCardModal(false);
    } finally {
      setOrderLoading(false);
    }
  };

  if (!orderOpen || !orderProduct) return null;

  return (
    <>
      <div className="order-modal-overlay" onClick={closeOrderModal}>
        <div className="order-modal" onClick={(e) => e.stopPropagation()}>
          <div className="order-modal-header">
            <h2>Đặt cọc — {orderProduct.name}</h2>
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
                      className={`order-sku-btn${selectedSku?.sku === sku.sku ? ' selected' : ''}`}
                      onClick={() => setSelectedSku(sku)}
                      title={sku.color?.colorName}
                    >
                      <span
                        className="order-color-swatch"
                        style={{ backgroundColor: sku.color?.colorHex ?? '#ccc' }}
                      />
                      <span>{sku.color?.colorName ?? 'Không rõ'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
              <label>Ghi chú (tuỳ chọn)</label>
              <textarea
                className="order-input"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Ghi chú thêm cho đơn hàng..."
                rows={3}
              />
            </div>

            {/* Payment method selection */}
            <div className="order-field">
              <label>Phương thức thanh toán</label>
              <div className="order-payment-methods">
                <button
                  type="button"
                  className={`order-payment-method-btn${paymentMethod === 'BANK_CARD' ? ' selected' : ''}`}
                  onClick={() => setPaymentMethod('BANK_CARD')}
                >
                  <span className="order-payment-icon"><CreditCard size={22} /></span>
                  <span className="order-payment-info">
                    <span className="order-payment-name">Thẻ ngân hàng</span>
                    <span className="order-payment-desc">Visa, Mastercard, JCB</span>
                  </span>
                  <span className="order-payment-radio">
                    {paymentMethod === 'BANK_CARD' && <span className="order-payment-radio-dot" />}
                  </span>
                </button>

                <button
                  type="button"
                  className={`order-payment-method-btn${paymentMethod === 'VNPAY' ? ' selected' : ''}`}
                  onClick={() => setPaymentMethod('VNPAY')}
                >
                  <span className="order-payment-icon"><Building2 size={22} /></span>
                  <span className="order-payment-info">
                    <span className="order-payment-name">Chuyển khoản VNPay</span>
                    <span className="order-payment-desc">Thanh toán qua cổng VNPay</span>
                  </span>
                  <span className="order-payment-radio">
                    {paymentMethod === 'VNPAY' && <span className="order-payment-radio-dot" />}
                  </span>
                </button>
              </div>
            </div>

            {orderError && <p className="order-error">{orderError}</p>}
          </div>

          <div className="order-modal-footer">
            <button className="btn btn-outline" onClick={closeOrderModal} disabled={orderLoading}>
              Huỷ
            </button>
            <button className="btn btn-primary" onClick={handleContinue} disabled={orderLoading}>
              {orderLoading ? 'Đang xử lý...' : 'Tiếp tục'}
            </button>
          </div>
        </div>
      </div>

      <CardPaymentModal
        open={showCardModal}
        onClose={() => setShowCardModal(false)}
        onConfirm={handleOrderSubmit}
        loading={orderLoading}
        depositAmount={Number(depositAmount)}
        productName={orderProduct.name}
      />
    </>
  );
}
