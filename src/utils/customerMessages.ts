const TECHNICAL_ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /invalid status|status transition|trạng thái.*không hợp lệ|chuyển trạng thái/i,
    message: 'Đơn hàng hiện chưa thể thực hiện thao tác này.',
  },
  {
    pattern: /forbidden|unauthorized|không có quyền/i,
    message: 'Bạn không có quyền thao tác với thông tin này.',
  },
  {
    pattern: /out of stock|hết hàng/i,
    message: 'Màu hoặc phiên bản này hiện đã hết hàng. Vui lòng chọn lựa chọn khác.',
  },
  {
    pattern: /vnpay|payment|thanh toán/i,
    message: 'Thanh toán chưa hoàn tất. Bạn có thể thử lại từ trang đơn hàng.',
  },
  {
    pattern: /failed to fetch|network|kết nối|connection/i,
    message: 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.',
  },
  {
    pattern: /error (fetching|posting|updating)|bad request|internal server error/i,
    message: 'Yêu cầu chưa được xử lý. Vui lòng thử lại sau.',
  },
];

export function toCustomerErrorMessage(message?: string | null, fallback = 'Có lỗi xảy ra. Vui lòng thử lại.'): string {
  const raw = message?.trim();
  if (!raw) return fallback;

  const matched = TECHNICAL_ERROR_PATTERNS.find(({ pattern }) => pattern.test(raw));
  return matched?.message ?? raw;
}
