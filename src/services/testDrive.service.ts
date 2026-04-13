import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/product.types';
import type {
  TestDriveCreateRequest,
  TestDriveUpdateRequest,
  TestDriveCancelRequest,
  TestDriveDto,
} from '../types/testDrive.types';

export const testDriveService = {
  bookTestDrive: async (request: TestDriveCreateRequest): Promise<ApiResponse<TestDriveDto>> => {
    return apiClient.post<ApiResponse<TestDriveDto>>('/test-drives/book', request);
  },

  getCustomerBookings: async (): Promise<ApiResponse<TestDriveDto[]>> => {
    return apiClient.get<ApiResponse<TestDriveDto[]>>('/test-drives/my-bookings');
  },

  getTestDriveById: async (code: string): Promise<ApiResponse<TestDriveDto>> => {
    return apiClient.get<ApiResponse<TestDriveDto>>(`/test-drives/${code}`);
  },

  rescheduleTestDrive: async (
    code: string,
    request: TestDriveUpdateRequest
  ): Promise<ApiResponse<TestDriveDto>> => {
    return apiClient.put<ApiResponse<TestDriveDto>>(`/test-drives/${code}/reschedule`, request);
  },

  cancelTestDrive: async (
    code: string,
    request: TestDriveCancelRequest
  ): Promise<ApiResponse<TestDriveDto>> => {
    return apiClient.post<ApiResponse<TestDriveDto>>(`/test-drives/${code}/cancel`, request);
  },
};
