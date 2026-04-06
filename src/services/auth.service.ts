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
  email: string;
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

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  /** Bắt buộc */
  phone: string;
  /** Tuỳ chọn */
  email?: string;
  address?: string;
}

export interface RegisterResponse {
  code: number;
  message: string;
  data?: unknown;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
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

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<RegisterResponse>;
  },

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};
