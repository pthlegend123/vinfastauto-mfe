import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/product.types';
import type { NotificationDto } from '../types/notification.types';

export const notificationService = {
  getNotifications: async (): Promise<ApiResponse<NotificationDto[]>> => {
    return apiClient.get<ApiResponse<NotificationDto[]>>('/notifications');
  },

  markAsRead: async (id: number): Promise<ApiResponse<NotificationDto>> => {
    return apiClient.put<ApiResponse<NotificationDto>>(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    return apiClient.put<ApiResponse<void>>('/notifications/read-all');
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    return apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  },
};
