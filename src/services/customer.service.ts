import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/product.types';
import { enviroment } from '../config/enviroment';
import { toCustomerErrorMessage } from '../utils/customerMessages';

const BASE_URL = enviroment.apiDomain;

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

  uploadKycImage: async (file: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/customers/kyc/images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (!response.ok) {
      throw new Error(toCustomerErrorMessage(response.statusText, 'Upload ảnh KYC thất bại. Vui lòng thử lại.'));
    }
    return response.json() as Promise<ApiResponse<{ imageUrl: string }>>;
  },
};
