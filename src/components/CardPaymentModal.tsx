import { useState } from 'react';
import { X, CreditCard, Lock } from 'lucide-react';
import './CardPaymentModal.css';

interface CardPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  depositAmount: number;
  productName: string;
}

interface CardFormState {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
}

interface CardFormErrors {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvv?: string;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatCardNumber = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const detectCardType = (number: string): 'visa' | 'mastercard' | 'jcb' | null => {
  const digits = number.replace(/\s/g, '');
  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
  if (/^35/.test(digits)) return 'jcb';
  return null;
};

const validateCard = (form: CardFormState): CardFormErrors => {
  const errors: CardFormErrors = {};
  const rawNumber = form.cardNumber.replace(/\s/g, '');

  if (rawNumber.length !== 16) {
    errors.cardNumber = 'Số thẻ phải có 16 chữ số.';
  }

  if (!form.cardholderName.trim()) {
    errors.cardholderName = 'Vui lòng nhập tên chủ thẻ.';
  }

  const [mm, yy] = form.expiryDate.split('/');
  const month = parseInt(mm, 10);
  const year = parseInt(`20${yy}`, 10);
  const now = new Date();
  const isValidFormat = mm && yy && yy.length === 2 && month >= 1 && month <= 12;
  const isExpired = isValidFormat && (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1));

  if (!isValidFormat) {
    errors.expiryDate = 'Định dạng không hợp lệ (MM/YY).';
  } else if (isExpired) {
    errors.expiryDate = 'Thẻ đã hết hạn.';
  }

  if (form.cvv.length < 3) {
    errors.cvv = 'CVV phải có 3–4 chữ số.';
  }

  return errors;
};

export default function CardPaymentModal({
  open,
  onClose,
  onConfirm,
  loading,
  depositAmount,
  productName,
}: CardPaymentModalProps) {
  const [form, setForm] = useState<CardFormState>({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  });
  const [errors, setErrors] = useState<CardFormErrors>({});
  const [showCvv, setShowCvv] = useState(false);

  if (!open) return null;

  const cardType = detectCardType(form.cardNumber);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }));
    setErrors((prev) => ({ ...prev, cardNumber: undefined }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, cardholderName: e.target.value.toUpperCase() }));
    setErrors((prev) => ({ ...prev, cardholderName: undefined }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, expiryDate: formatExpiry(e.target.value) }));
    setErrors((prev) => ({ ...prev, expiryDate: undefined }));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setForm((prev) => ({ ...prev, cvv: digits }));
    setErrors((prev) => ({ ...prev, cvv: undefined }));
  };

  const handleSubmit = () => {
    const validationErrors = validateCard(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onConfirm();
  };

  const handleOverlayClick = () => {
    if (!loading) onClose();
  };

  return (
    <div className="card-modal-overlay" onClick={handleOverlayClick}>
      <div className="card-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="card-modal-header">
          <div className="card-modal-header-left">
            <CreditCard size={20} className="card-modal-header-icon" />
            <h2>Thông tin thẻ ngân hàng</h2>
          </div>
          <button
            className="card-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Order summary */}
        <div className="card-modal-summary">
          <span className="card-modal-summary-label">Đặt cọc cho</span>
          <span className="card-modal-summary-product">{productName}</span>
          <span className="card-modal-summary-amount">{formatPrice(depositAmount)}</span>
        </div>

        {/* Card visual preview */}
        <div className="card-modal-card-preview">
          <div className={`card-preview-chip${cardType ? ` card-type-${cardType}` : ''}`}>
            <div className="card-preview-top">
              <span className="card-preview-type-label">
                {cardType === 'visa' && 'VISA'}
                {cardType === 'mastercard' && 'MASTERCARD'}
                {cardType === 'jcb' && 'JCB'}
                {!cardType && 'CARD'}
              </span>
              <Lock size={14} className="card-preview-lock" />
            </div>
            <div className="card-preview-number">
              {form.cardNumber || '•••• •••• •••• ••••'}
            </div>
            <div className="card-preview-bottom">
              <div>
                <div className="card-preview-sublabel">Chủ thẻ</div>
                <div className="card-preview-name">
                  {form.cardholderName || 'TÊN CHỦ THẺ'}
                </div>
              </div>
              <div>
                <div className="card-preview-sublabel">Hết hạn</div>
                <div className="card-preview-expiry">{form.expiryDate || 'MM/YY'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card-modal-body">
          {/* Card number */}
          <div className="card-field">
            <label htmlFor="card-number">Số thẻ</label>
            <input
              id="card-number"
              type="text"
              inputMode="numeric"
              className={`card-input${errors.cardNumber ? ' error' : ''}`}
              value={form.cardNumber}
              onChange={handleCardNumberChange}
              placeholder="0000 0000 0000 0000"
              autoComplete="cc-number"
            />
            {errors.cardNumber && <span className="card-field-error">{errors.cardNumber}</span>}
          </div>

          {/* Cardholder name */}
          <div className="card-field">
            <label htmlFor="card-name">Tên chủ thẻ</label>
            <input
              id="card-name"
              type="text"
              className={`card-input${errors.cardholderName ? ' error' : ''}`}
              value={form.cardholderName}
              onChange={handleNameChange}
              placeholder="NGUYEN VAN A"
              autoComplete="cc-name"
            />
            {errors.cardholderName && (
              <span className="card-field-error">{errors.cardholderName}</span>
            )}
          </div>

          {/* Expiry + CVV row */}
          <div className="card-field-row">
            <div className="card-field">
              <label htmlFor="card-expiry">Ngày hết hạn</label>
              <input
                id="card-expiry"
                type="text"
                inputMode="numeric"
                className={`card-input${errors.expiryDate ? ' error' : ''}`}
                value={form.expiryDate}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                autoComplete="cc-exp"
              />
              {errors.expiryDate && (
                <span className="card-field-error">{errors.expiryDate}</span>
              )}
            </div>

            <div className="card-field">
              <label htmlFor="card-cvv">
                CVV
                <span className="card-cvv-hint">3–4 chữ số mặt sau thẻ</span>
              </label>
              <div className="card-cvv-wrapper">
                <input
                  id="card-cvv"
                  type={showCvv ? 'text' : 'password'}
                  inputMode="numeric"
                  className={`card-input${errors.cvv ? ' error' : ''}`}
                  value={form.cvv}
                  onChange={handleCvvChange}
                  placeholder="•••"
                  autoComplete="cc-csc"
                />
                <button
                  type="button"
                  className="card-cvv-toggle"
                  onClick={() => setShowCvv((v) => !v)}
                  tabIndex={-1}
                >
                  {showCvv ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              {errors.cvv && <span className="card-field-error">{errors.cvv}</span>}
            </div>
          </div>

          <p className="card-modal-secure-note">
            <Lock size={12} /> Thông tin thẻ được mã hoá an toàn. Chúng tôi không lưu trữ dữ liệu thẻ của bạn.
          </p>
        </div>

        {/* Footer */}
        <div className="card-modal-footer">
          <button
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            Quay lại
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : `Thanh toán ${formatPrice(depositAmount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
