import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/product.types';
import type { OrderResponse, CreateOrderRequest, OrderCancelRequest } from '../types/order.types';

interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const orderService = {
  getMyOrders: async (page = 0, size = 10): Promise<ApiResponse<PagedResponse<OrderResponse>>> => {
    return apiClient.get<ApiResponse<PagedResponse<OrderResponse>>>(
      `/orders/my-orders?page=${page}&size=${size}`
    );
  },

  getOrderByCode: async (orderCode: string): Promise<ApiResponse<OrderResponse>> => {
    return apiClient.get<ApiResponse<OrderResponse>>(`/orders/${orderCode}`);
  },

  createOrder: async (request: CreateOrderRequest): Promise<ApiResponse<string>> => {
    return apiClient.post<ApiResponse<string>>('/orders/create', request);
  },

  cancelOrder: async (
    orderCode: string,
    request: OrderCancelRequest
  ): Promise<ApiResponse<OrderResponse>> => {
    return apiClient.post<ApiResponse<OrderResponse>>(`/orders/${orderCode}/cancel`, request);
  },
};
