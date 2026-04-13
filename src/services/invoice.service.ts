import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/product.types';
import type { InvoiceResponse } from '../types/invoice.types';

export const invoiceService = {
  getInvoicesByOrder: async (orderCode: string): Promise<ApiResponse<InvoiceResponse[]>> => {
    return apiClient.get<ApiResponse<InvoiceResponse[]>>(`/invoices/order/${orderCode}`);
  },

  getInvoiceByCode: async (invoiceCode: string): Promise<ApiResponse<InvoiceResponse>> => {
    return apiClient.get<ApiResponse<InvoiceResponse>>(`/invoices/${invoiceCode}`);
  },
};
