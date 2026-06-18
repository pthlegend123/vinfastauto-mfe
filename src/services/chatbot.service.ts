import { apiClient } from './apiClient';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessagePayload {
  role: ChatRole;
  content: string;
}

export interface ChatbotResponse {
  reply: string;
  poweredBy: string;
  privacyNotice: string;
  sources: string[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const chatbotService = {
  sendMessage: (message: string, history: ChatMessagePayload[]) =>
    apiClient.post<ApiResponse<ChatbotResponse>>('/chatbot/messages', {
      message,
      history,
    }),
};
