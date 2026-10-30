import { apiFetch } from './api';
import { TwoFactorChallenge, TwoFactorStatus } from '@/types/two-factor';

export interface TwoFactorSessionResponse {
    accessToken: string;
    tokenType: string;
    expiresAt: string;
}

// Segundo paso del login: aún no hay token, solo el identificador del reto.

export function verifyTwoFactorCode(challengeId: string, code: string): Promise<TwoFactorSessionResponse> {
    return apiFetch<TwoFactorSessionResponse>('/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeId, code }),
        publicRequest: true
    });
}

export function resendTwoFactorCode(challengeId: string): Promise<TwoFactorChallenge> {
    return apiFetch<TwoFactorChallenge>('/api/auth/2fa/resend', {
        method: 'POST',
        body: JSON.stringify({ challengeId }),
        publicRequest: true
    });
}

export function cancelTwoFactor(challengeId: string): Promise<void> {
    return apiFetch<void>('/api/auth/2fa/cancel', {
        method: 'POST',
        body: JSON.stringify({ challengeId }),
        publicRequest: true
    });
}

// Configuración del 2FA desde el perfil propio (requiere sesión).

const MY_TWO_FACTOR = '/api/profile/me/two-factor';

export function fetchTwoFactorStatus(signal?: AbortSignal): Promise<TwoFactorStatus> {
    return apiFetch<TwoFactorStatus>(MY_TWO_FACTOR, { signal });
}

export function updateTwoFactor(enabled: boolean, currentPassword: string): Promise<TwoFactorStatus> {
    return apiFetch<TwoFactorStatus>(MY_TWO_FACTOR, {
        method: 'PUT',
        body: JSON.stringify({ enabled, currentPassword })
    });
}
