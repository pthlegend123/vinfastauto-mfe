import { enviroment } from '../config/enviroment.ts';

const BASE_URL = enviroment.apiDomain;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CustomerInfo {
  id: number;
  customerCode: string;
  username: string;
  fullName: string;
  phone: string;
  isPhoneVerified: boolean;
  email: string;
  isEmailVerified: boolean;
  address: string;
  kycStatus: string;
  status: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data?: {
    accessToken: string;
    tokenType: string;
    customer: CustomerInfo;
  };
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${BASE_URL}/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json() as Promise<LoginResponse>;
  },

  saveSession: (data: LoginResponse['data']) => {
    if (data) {
      localStorage.setItem('auth_token', data.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(data));
    }
  },

  clearSession: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getStoredUser: (): LoginResponse['data'] | null => {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isTokenExpired: (): boolean => {
    const token = localStorage.getItem('auth_token');
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('auth_token') && !authService.isTokenExpired();
  },

  // ── OTP registration flow ──────────────────────────────────────────────────

  otpSend: async (phone: string): Promise<ApiResponse> => {
    const response = await fetch(`${BASE_URL}/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return response.json() as Promise<ApiResponse>;
  },

  otpVerify: async (phone: string, otpCode: string): Promise<ApiResponse> => {
    const response = await fetch(`${BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otpCode }),
    });
    return response.json() as Promise<ApiResponse>;
  },

  otpRegister: async (
    phone: string,
    username: string,
    fullName: string,
    password: string,
  ): Promise<ApiResponse<CustomerInfo>> => {
    const response = await fetch(`${BASE_URL}/otp/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, username, fullName, password }),
    });
    return response.json() as Promise<ApiResponse<CustomerInfo>>;
  },

  // ── Forgot password flow ───────────────────────────────────────────────────

  sendForgotPasswordOtp: async (phone: string): Promise<ApiResponse> => {
    const response = await fetch(`${BASE_URL}/auth/customer/forgot-password/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return response.json() as Promise<ApiResponse>;
  },

  verifyForgotPasswordOtp: async (phone: string, otpCode: string): Promise<ApiResponse> => {
    const response = await fetch(`${BASE_URL}/auth/customer/forgot-password/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otpCode }),
    });
    return response.json() as Promise<ApiResponse>;
  },

  resetCustomerPassword: async (phone: string, newPassword: string): Promise<ApiResponse> => {
    const response = await fetch(`${BASE_URL}/auth/customer/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, newPassword }),
    });
    return response.json() as Promise<ApiResponse>;
  },
};
