// Mismas reglas que el backend (ProfilePhotoService y ProfileRequestDTO),
// para avisar al usuario antes de enviar.

export const PROFILE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const PROFILE_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

const ACCEPTED_TYPES = PROFILE_PHOTO_ACCEPT.split(',');
const PHONE_PATTERN = /^[0-9]{7,15}$/;

export function validateProfilePhoto(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
        return 'La foto debe ser una imagen JPG, PNG o WebP';
    }
    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
        return 'La foto no puede superar 2 MB';
    }
    return null;
}

export function validatePhone(phone: string): string | null {
    const value = phone.trim();
    return value === '' || PHONE_PATTERN.test(value) ? null : 'El teléfono debe contener entre 7 y 15 dígitos';
}

const PROVIDER_LABELS: Record<string, string> = {
    LOCAL: 'Correo y contraseña',
    'google.com': 'Google',
    'github.com': 'GitHub',
    discord: 'Discord'
};

export function authProviderLabel(provider: string): string {
    return PROVIDER_LABELS[provider] ?? provider;
}
