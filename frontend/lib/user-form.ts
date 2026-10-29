import { isStrongPassword } from './password-rules';
import { UserFormValues } from '@/types/security';

export type UserFormMode = 'create' | 'edit';

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mismas reglas que CreateUserDTO / UpdateUserDTO en el backend.
 * canSetPassword es false para cuentas OAuth, que no tienen contraseña propia.
 */
export function validateUserForm(values: UserFormValues, mode: UserFormMode, canSetPassword = true): UserFormErrors {
    const errors: UserFormErrors = {};
    const name = values.name.trim();

    if (name.length < 2 || name.length > 100) {
        errors.name = 'El nombre debe tener entre 2 y 100 caracteres';
    }
    if (!EMAIL_PATTERN.test(values.email.trim())) {
        errors.email = 'Escribe un correo válido';
    }

    const passwordRequired = mode === 'create';
    if (passwordRequired && !values.password) {
        errors.password = 'La contraseña es obligatoria';
    } else if (values.password && !canSetPassword) {
        errors.password = 'Este usuario inicia sesión con un proveedor externo y no tiene contraseña';
    } else if (values.password && !isStrongPassword(values.password)) {
        errors.password = 'La contraseña no cumple los requisitos';
    }

    return errors;
}

export function hasErrors(errors: UserFormErrors): boolean {
    return Object.keys(errors).length > 0;
}
