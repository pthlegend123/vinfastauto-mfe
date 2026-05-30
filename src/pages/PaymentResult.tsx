import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { enviroment } from '../config/enviroment';
import { toCustomerErrorMessage } from '../utils/customerMessages';

type PaymentState = 'loading' | 'success' | 'failed';

const RESPONSE_LABELS: Record<string, string> = {
  '00': 'Thanh toán thành công',
  '07': 'Giao dịch nghi ngờ gian lận',
  '09': 'Thẻ/tài khoản chưa đăng ký Internet Banking',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá số lần',
  '11': 'Đã hết hạn thanh toán',
  '12': 'Thẻ/tài khoản bị khóa',
  '24': 'Khách hàng đã hủy giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Tài khoản vượt hạn mức giao dịch',
  '75': 'Ngân hàng đang bảo trì',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần',
};

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<PaymentState>('loading');
  const [message, setMessage] = useState('Đang đối soát kết quả thanh toán...');
  const hasPaymentParams = Boolean(window.location.search);

  const orderCode = searchParams.get('vnp_TxnRef') || '';
  const responseCode = searchParams.get('vnp_ResponseCode') || '';
  const amount = useMemo(() => {
    const rawAmount = Number(searchParams.get('vnp_Amount') || 0);
    return rawAmount > 0 ? rawAmount / 100 : 0;
  }, [searchParams]);

  useEffect(() => {
    const normalizeCode = (code?: string | null) => (code ?? '').trim();

    const isSuccessfulPayment = (gatewayCode: string, reconcileCode?: string) => {
      // VNPay success on redirect is vnp_ResponseCode=00.
      // Reconcile can be 00 (newly confirmed) or 02 (already confirmed/idempotent).
      if (gatewayCode !== '00') return false;
      if (!reconcileCode) return true;
      return reconcileCode === '00' || reconcileCode === '02';
    };

    const confirmPayment = async () => {
      try {
        const response = await fetch(`${enviroment.apiDomain}/vnpay/webhook${window.location.search}`);
        if (!response.ok) throw new Error(response.statusText);
        const result = await response.json() as { RspCode?: string; Message?: string };
        const gatewayCode = normalizeCode(responseCode);
        const reconcileCode = normalizeCode(result.RspCode);

        if (isSuccessfulPayment(gatewayCode, reconcileCode)) {
          setState('success');
          setMessage(RESPONSE_LABELS[gatewayCode] || 'Thanh toán thành công');
        } else {
          setState('failed');
          setMessage(
            result.Message
              ? `Đối soát thất bại: ${result.Message}`
              : `Thanh toán không thành công (gateway=${gatewayCode || '-'}, reconcile=${reconcileCode || '-'})`
          );
        }
      } catch (err) {
        if (normalizeCode(responseCode) === '00') {
          setState('success');
          setMessage('Thanh toán thành công. Hệ thống đang đồng bộ kết quả.');
        } else {
          setState('failed');
          setMessage(toCustomerErrorMessage(err instanceof Error ? err.message : null, 'Không thể đối soát kết quả thanh toán. Bạn có thể thử thanh toán lại từ trang đơn hàng.'));
        }
      }
    };

    if (!hasPaymentParams) {
      setState('failed');
      setMessage('Không có thông tin thanh toán từ VNPay. Vui lòng quay lại đơn hàng của bạn.');
      return;
    }
    confirmPayment();
  }, [hasPaymentParams, responseCode]);

  const Icon = state === 'loading' ? Clock : state === 'success' ? CheckCircle : XCircle;
  const color = state === 'success' ? '#0f8f4d' : state === 'loading' ? '#8a6d00' : '#b42318';

  return (
    <div style={{ maxWidth: '560px', margin: '48px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '32px 24px', background: '#fff' }}>
        <Icon size={48} color={color} />
        <h1 style={{ fontSize: '24px', margin: '16px 0 8px', color: '#222' }}>
          Kết quả thanh toán VNPay
        </h1>
        <p style={{ color, fontWeight: 600, marginBottom: '20px' }}>{message}</p>
        {hasPaymentParams && (
          <div style={{ display: 'grid', gap: '10px', textAlign: 'left', marginBottom: '24px' }}>
            <div><strong>Mã đơn hàng:</strong> {orderCode || '-'}</div>
            <div><strong>Mã phản hồi VNPay:</strong> {responseCode || '-'}</div>
            <div><strong>Số tiền:</strong> {amount ? amount.toLocaleString('vi-VN') + ' VND' : '-'}</div>
            <div><strong>Mã giao dịch:</strong> {searchParams.get('vnp_TransactionNo') || '-'}</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {orderCode && (
            <button
              type="button"
              onClick={() => navigate(`/my-orders/${orderCode}`)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 0, background: '#0066cc', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            >
              Xem đơn hàng
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/my-orders')}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', color: '#333', cursor: 'pointer', fontWeight: 600 }}
          >
            Đơn hàng của tôi
          </button>
        </div>
      </div>
    </div>
  );
}
