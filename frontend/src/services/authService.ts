import api from './api';

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export const authService = {
  /**
   * Reenvia o email de verificação para o usuário
   */
  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    const response = await api.post<ResendVerificationResponse>('/auth/resend-verification', { email });
    return response.data;
  },

  /**
   * Verifica o email usando o token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.get<{ message: string }>(`/auth/verify-email?token=${token}`);
    return response.data;
  },
};
