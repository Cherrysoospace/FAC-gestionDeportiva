'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { ProgressSpinner } from 'primereact/progressspinner';
import AuthCard from '../components/AuthCard';
import AuthLoading from '../components/AuthLoading';
import PasswordRulesList from '@/components/ui/PasswordRulesList';
import { useResetPassword } from './useResetPassword';
import { PASSWORD_RESET_SUCCESS_KEY } from '@/lib/password-recovery-api';

const ResetPasswordContent = () => {
    const router = useRouter();
    const token = useSearchParams().get('token');

    const goToLogin = () => {
        sessionStorage.setItem(PASSWORD_RESET_SUCCESS_KEY, 'true');
        router.replace('/auth/login');
    };

    const { status, newPassword, setNewPassword, confirmation, setConfirmation, unmetRules, passwordsMatch, canSubmit, error, submit } = useResetPassword(token, goToLogin);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void submit();
    };

    if (status === 'validating') {
        return (
            <AuthCard title="Restablecer contraseña">
                <div className="flex justify-content-center">
                    <ProgressSpinner className="w-3rem h-3rem" strokeWidth="4" aria-label="Validando el enlace" />
                </div>
            </AuthCard>
        );
    }

    if (status === 'invalid') {
        return (
            <AuthCard icon="pi-link" tone="danger" title="Enlace no válido">
                <Message severity="error" text={error ?? ''} className="w-full mb-4" />
                <Button type="button" label="Solicitar un nuevo enlace" icon="pi pi-envelope" className="w-full" onClick={() => router.push('/auth/forgot-password')} />
                <Button type="button" label="Volver a iniciar sesión" link className="w-full mt-3" onClick={() => router.push('/auth/login')} />
            </AuthCard>
        );
    }

    return (
        <AuthCard title="Restablecer contraseña" subtitle="Elige una contraseña nueva">
            {error && <Message severity="error" text={error} className="w-full mb-4" />}
            <form onSubmit={handleSubmit}>
                <label htmlFor="newPassword" className="block text-900 font-medium mb-2">
                    Nueva contraseña
                </label>
                <Password inputId="newPassword" aria-describedby="new-password-rules" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} toggleMask feedback={false} className="w-full mb-2" inputClassName="w-full" autoComplete="new-password" autoFocus required />
                <div id="new-password-rules">
                    <PasswordRulesList password={newPassword} unmetRules={unmetRules} />
                </div>

                <label htmlFor="confirmation" className="block text-900 font-medium mb-2 mt-3">
                    Confirmar contraseña
                </label>
                <Password inputId="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} toggleMask feedback={false} className="w-full mb-2" inputClassName="w-full" autoComplete="new-password" required />
                {confirmation.length > 0 && !passwordsMatch && <small className="p-error block mb-2">Las contraseñas no coinciden</small>}

                <Button type="submit" label="Guardar contraseña" icon="pi pi-check" className="w-full mt-3" loading={status === 'saving'} disabled={!canSubmit} />
            </form>
        </AuthCard>
    );
};

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<AuthLoading />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
