// Mismas reglas que @StrongPassword en el backend, para avisar antes de enviar.
export interface PasswordRule {
    label: string;
    test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
    { label: 'Entre 8 y 72 caracteres', test: (value) => value.length >= 8 && value.length <= 72 },
    { label: 'Una letra mayúscula', test: (value) => /[A-Z]/.test(value) },
    { label: 'Una letra minúscula', test: (value) => /[a-z]/.test(value) },
    { label: 'Un número', test: (value) => /\d/.test(value) },
    { label: 'Un carácter especial (@$!%*?&)', test: (value) => /[@$!%*?&]/.test(value) },
    { label: 'Sin espacios', test: (value) => value.length > 0 && !/\s/.test(value) }
];

export function unmetPasswordRules(password: string): string[] {
    return PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.label);
}

export function isStrongPassword(password: string): boolean {
    return unmetPasswordRules(password).length === 0;
}
