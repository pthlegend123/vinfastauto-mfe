import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/product.types';

export interface CustomerProfile {
  customerCode: string;
  fullName: string;
  phone: string;
  email?: string;
  kycStatus: string;
  idCardNumber?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  drivingLicenseNumber?: string;
  drivingLicenseImageUrl?: string;
  licenseClass?: string;
  kycRejectionReason?: string;
}

export interface KycUploadRequest {
  idCardNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  drivingLicenseNumber: string;
  drivingLicenseImageUrl: string;
  licenseClass: string;
}

export const customerService = {
  getProfile: async (): Promise<ApiResponse<CustomerProfile>> => {
    return apiClient.get<ApiResponse<CustomerProfile>>('/customers/profile');
  },

  updateProfile: async (fullName: string, email: string): Promise<ApiResponse<CustomerProfile>> => {
    return apiClient.put<ApiResponse<CustomerProfile>>('/customers/profile', { fullName, email });
  },

  uploadKyc: async (request: KycUploadRequest): Promise<ApiResponse<CustomerProfile>> => {
    return apiClient.post<ApiResponse<CustomerProfile>>('/customers/kyc', request);
  },
};
