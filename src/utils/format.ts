export const EMPTY_VALUE = '—';

export function formatDate(
  value?: string | null,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
) {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return new Intl.DateTimeFormat('vi-VN', options).format(date);
}

export function formatCurrency(amount?: number | null) {
  if (amount === undefined || amount === null) return EMPTY_VALUE;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
