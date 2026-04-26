import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/product.types';
import type {
  MaintenanceBookingDto,
  CreateMaintenanceBookingRequest,
  MaintenanceCancelRequest,
} from '../types/maintenance.types';

export const maintenanceService = {
  bookMaintenance: async (
    request: CreateMaintenanceBookingRequest
  ): Promise<ApiResponse<MaintenanceBookingDto>> => {
    return apiClient.post<ApiResponse<MaintenanceBookingDto>>('/maintenance/book', request);
  },

  getMyBookings: async (): Promise<ApiResponse<MaintenanceBookingDto[]>> => {
    return apiClient.get<ApiResponse<MaintenanceBookingDto[]>>('/maintenance/my-bookings');
  },

  getBookingByCode: async (code: string): Promise<ApiResponse<MaintenanceBookingDto>> => {
    return apiClient.get<ApiResponse<MaintenanceBookingDto>>(`/maintenance/${code}`);
  },

  cancelBooking: async (
    code: string,
    request: MaintenanceCancelRequest
  ): Promise<ApiResponse<MaintenanceBookingDto>> => {
    return apiClient.post<ApiResponse<MaintenanceBookingDto>>(`/maintenance/${code}/cancel`, request);
  },
};
