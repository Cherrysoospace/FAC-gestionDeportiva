/** Reto pendiente tras validar correo y contraseña con 2FA activo (HU-SE-10). */
export interface TwoFactorChallenge {
    challengeId: string;
    /** Instante ISO en que vence el código */
    expiresAt: string;
    /** Instante ISO desde el que se puede pedir otro código */
    resendAvailableAt: string;
    /** Correo enmascarado al que se envió el código */
    destination: string;
}

export interface TwoFactorStatus {
    enabled: boolean;
    /** false en cuentas OAuth: su seguridad la gestiona el proveedor */
    available: boolean;
}
