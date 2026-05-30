import { enviroment } from '../config/enviroment.ts';
import { toCustomerErrorMessage } from '../utils/customerMessages';

const BASE_URL = enviroment.apiDomain;

let unauthorizedHandler: (() => void) | null = null;

export const registerUnauthorizedHandler = (fn: () => void): void => {
  unauthorizedHandler = fn;
};

const handleUnauthorized = (): void => {
  const handler = unauthorizedHandler;
  unauthorizedHandler = null; // prevent double-fire on concurrent 401s
  handler?.();
};

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const getApiErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const payload = (await response.clone().json()) as { message?: unknown };
    const message = typeof payload.message === 'string' && payload.message.trim()
      ? payload.message
      : fallback;
    return toCustomerErrorMessage(message, toCustomerErrorMessage(fallback));
  } catch {
    return toCustomerErrorMessage(fallback);
  }
};

export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }
    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, `Error fetching ${url}: ${response.statusText}`));
    }
    return response.json() as Promise<T>;
  },

  post: async <T>(url: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }
    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, `Error posting to ${url}: ${response.statusText}`));
    }
    return response.json() as Promise<T>;
  },

  put: async <T>(url: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }
    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, `Error updating ${url}: ${response.statusText}`));
    }
    return response.json() as Promise<T>;
  },
};
