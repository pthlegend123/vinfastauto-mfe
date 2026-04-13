export type OrderStatus =
  | 'PENDING_DEPOSIT'
  | 'DEPOSIT_PAID'
  | 'SALES_CONFIRMED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export interface OrderResponse {
  orderCode: string;
  customerCode: string;
  skuCode: string;
  productName: string;
  variantName: string;
  colorName: string;
  depositAmount: number;
  totalPrice: number;
  status: OrderStatus;
  testDriveDate?: string;
  handoverDate?: string;
  createdAt: string;
  updatedAt?: string;
  assignedEmployeeCode?: string;
}

export interface CreateOrderRequest {
  skuCode: string;
  depositAmount: number;
  testDriveDate?: string;
  handoverDate?: string;
  note?: string;
}

export interface OrderCancelRequest {
  reason: string;
}
