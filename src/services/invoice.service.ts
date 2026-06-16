import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/product.types';
import type { InvoiceResponse } from '../types/invoice.types';

export const invoiceService = {
  getInvoicesByOrder: async (orderCode: string): Promise<ApiResponse<InvoiceResponse[]>> => {
    return apiClient.get<ApiResponse<InvoiceResponse[]>>(`/orders/${orderCode}/invoices`);
  },

  downloadInvoicePdf: async (orderCode: string, invoiceCode: string): Promise<Blob> => {
    return apiClient.getBlob(`/orders/${orderCode}/invoices/${invoiceCode}/pdf`);
  },
};
