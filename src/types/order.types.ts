export type OrderStatus =
  | 'PENDING_DEPOSIT'
  | 'DEPOSIT_PAID'
  | 'SALES_CONFIRMED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type HandoverRescheduleStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OrderResponse {
  orderCode: string;
  customerCode: string;
  customerName?: string;
  sku: string;
  productName: string;
  variantName?: string;
  colorName?: string;
  colorHex?: string;
  assignedEmployeeCode?: string;
  assignedEmployeeName?: string;
  depositAmount: number;
  totalPrice: number;
  status: OrderStatus;
  testDriveDate?: string;
  handoverDate?: string;
  handoverLocation?: string;
  requestedHandoverDate?: string;
  handoverRescheduleReason?: string;
  handoverRescheduleNote?: string;
  handoverRescheduleStatus?: HandoverRescheduleStatus;
  handoverRescheduleReviewedAt?: string;
  handoverRescheduleReviewedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  sku: string;
  depositAmount: number;
  totalPrice: number;
  testDriveDate?: string;
  note?: string;
}

export interface OrderCancelRequest {
  reason: string;
}

export interface HandoverRescheduleRequest {
  requestedHandoverDate: string;
  reason?: string;
}
