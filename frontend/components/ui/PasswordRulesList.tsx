import React from 'react';
import { PASSWORD_RULES } from '@/lib/password-rules';

interface PasswordRulesListProps {
    password: string;
    unmetRules: string[];
}

// Muestra en vivo qué reglas de seguridad cumple la contraseña escrita.
export default function PasswordRulesList({ password, unmetRules }: PasswordRulesListProps) {
    return (
        <ul className="list-none p-0 m-0 text-sm" aria-label="Requisitos de la contraseña">
            {PASSWORD_RULES.map(({ label }) => {
                const met = password.length > 0 && !unmetRules.includes(label);
                return (
                    <li key={label} className={`flex align-items-center gap-2 mb-1 ${met ? 'text-green-600' : 'text-600'}`}>
                        <i className={`pi ${met ? 'pi-check-circle' : 'pi-circle'}`} aria-hidden="true" />
                        <span>{label}</span>
                    </li>
                );
            })}
        </ul>
    );
}
