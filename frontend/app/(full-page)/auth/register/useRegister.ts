'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/layout/context/authcontext';
import { ApiRequestError } from '@/lib/api';
import { unmetPasswordRules } from '@/lib/password-rules';
import { useSocialLogin } from '../hooks/useSocialLogin';

function registerErrorMessage(cause: unknown): string {
    if (!(cause instanceof ApiRequestError)) return 'No se pudo crear la cuenta';
    if (cause.status === 409) return 'Ya existe una cuenta con ese correo';
    if (cause.status === 400) return cause.message || 'Revisa los datos ingresados';
    if (cause.status === 0) return 'No se pudo conectar con el servidor';
    return cause.message;
}

export function useRegister() {
    const router = useRouter();
    const { register, isAuthenticated, isLoading } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const social = useSocialLogin('/', setError);

    const unmetRules = unmetPasswordRules(password);
    const passwordsMatch = confirmation.length === 0 || password === confirmation;

    useEffect(() => {
        if (!isLoading && isAuthenticated) router.replace('/');
    }, [isAuthenticated, isLoading, router]);

    const submit = async () => {
        setError(null);
        if (unmetRules.length > 0) {
            setError('La contraseña no cumple todos los requisitos');
            return;
        }
        if (password !== confirmation) {
            setError('Las contraseñas no coinciden');
            return;
        }
        setSubmitting(true);
        try {
            await register(name, email, password);
            sessionStorage.setItem('registrationSuccess', 'true');
            router.replace('/auth/login');
        } catch (cause) {
            setError(registerErrorMessage(cause));
        } finally {
            setSubmitting(false);
        }
    };

    return {
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword,
        confirmation,
        setConfirmation,
        unmetRules,
        passwordsMatch,
        submitting,
        busy: submitting || social.loadingProvider !== null || isLoading,
        error,
        submit,
        socialProvider: social.loadingProvider,
        signInWith: social.signIn
    };
}
