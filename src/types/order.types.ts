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
  customerName?: string;
  sku: string;
  productName: string;
  colorName?: string;
  assignedEmployeeCode?: string;
  assignedEmployeeName?: string;
  depositAmount: number;
  totalPrice: number;
  status: OrderStatus;
  testDriveDate?: string;
  handoverDate?: string;
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
