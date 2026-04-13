export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface InvoiceResponse {
  invoiceCode: string;
  orderCode: string;
  invoiceType: string;
  amount: number;
  paymentMethod: string;
  bankTransactionId?: string;
  transferContent?: string;
  status: InvoiceStatus;
  creatorEmployeeCode?: string;
  createdAt: string;
}
