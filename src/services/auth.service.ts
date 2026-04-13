const BASE_URL = 'http://localhost:8080/api/v1';

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

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('auth_token');
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
    fullName: string,
    password: string,
  ): Promise<ApiResponse<CustomerInfo>> => {
    const response = await fetch(`${BASE_URL}/otp/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, fullName, password }),
    });
    return response.json() as Promise<ApiResponse<CustomerInfo>>;
  },
};
