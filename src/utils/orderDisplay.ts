import type { OrderResponse, OrderStatus } from '../types/order.types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_DEPOSIT: 'Chờ đặt cọc',
  DEPOSIT_PAID: 'Đã đặt cọc',
  SALES_CONFIRMED: 'Nhân viên đã xác nhận',
  DELIVERED: 'Đã bàn giao xe',
  CANCELLED: 'Đã hủy',
  REFUND_PENDING: 'Đang chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  PENDING_DEPOSIT: 'Đơn đã được tạo. Bạn cần hoàn tất tiền đặt cọc qua VNPay để giữ xe.',
  DEPOSIT_PAID: 'VinFast đã ghi nhận tiền đặt cọc. Nhân viên sẽ liên hệ xác nhận đơn hàng.',
  SALES_CONFIRMED: 'Đơn hàng đã được xác nhận. Nhân viên sẽ hướng dẫn thanh toán phần còn lại và bàn giao.',
  DELIVERED: 'Xe đã được bàn giao. Cảm ơn bạn đã tin tưởng VinFast.',
  CANCELLED: 'Đơn hàng đã bị hủy. Nếu cần hỗ trợ thêm, vui lòng liên hệ bộ phận chăm sóc khách hàng.',
  REFUND_PENDING: 'Yêu cầu hoàn tiền đã được ghi nhận và đang chờ xử lý.',
  REFUNDED: 'Khoản tiền cần hoàn đã được xử lý.',
};

export const ORDER_NEXT_ACTIONS: Partial<Record<OrderStatus, string>> = {
  PENDING_DEPOSIT: 'Việc cần làm: bấm Thanh toán đặt cọc để mở lại VNPay.',
  DEPOSIT_PAID: 'Bước tiếp theo: chờ nhân viên xác nhận và liên hệ.',
  SALES_CONFIRMED: 'Bước tiếp theo: làm theo hướng dẫn của nhân viên để thanh toán phần còn lại.',
  REFUND_PENDING: 'Bước tiếp theo: chờ nhân viên xử lý hoàn tiền.',
};

export function getRemainingAmount(totalPrice?: number | null, depositAmount?: number | null): number | null {
  if (typeof totalPrice !== 'number' || totalPrice <= 0) return null;
  const deposit = typeof depositAmount === 'number' ? depositAmount : 0;
  return Math.max(totalPrice - deposit, 0);
}

export function getOrderRemainingAmount(order: OrderResponse): number | null {
  return getRemainingAmount(order.totalPrice, order.depositAmount);
}
