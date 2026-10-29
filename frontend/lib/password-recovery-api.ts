import { apiFetch } from './api';

// Bandera en sessionStorage para que el login muestre "contraseña actualizada".
export const PASSWORD_RESET_SUCCESS_KEY = 'passwordResetSuccess';

export interface MessageResponse {
    message: string;
}

export function requestPasswordReset(email: string): Promise<MessageResponse> {
    return apiFetch<MessageResponse>('/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
        publicRequest: true
    });
}

export function validateResetToken(token: string, signal?: AbortSignal): Promise<void> {
    return apiFetch<void>(`/api/auth/password/reset/validate?token=${encodeURIComponent(token)}`, {
        signal,
        publicRequest: true
    });
}

export function resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
    return apiFetch<MessageResponse>('/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
        publicRequest: true
    });
}
