'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/layout/context/authcontext';
import { ApiRequestError } from '@/lib/api';
import { PASSWORD_RESET_SUCCESS_KEY } from '@/lib/password-recovery-api';
import { useSocialLogin } from '../hooks/useSocialLogin';

const REGISTRATION_SUCCESS_KEY = 'registrationSuccess';

function safeDestination(requested: string | null): string {
    const destination = requested || '/';
    return destination.startsWith('/') && !destination.startsWith('//') && !destination.includes('\\') ? destination : '/';
}

function loginErrorMessage(cause: unknown): string {
    if (cause instanceof ApiRequestError) {
        if (cause.status === 0) return 'No se pudo conectar con el servidor';
        if (cause.status === 403) return 'Tu usuario está deshabilitado';
        // El backend indica si la cuenta usa Google, GitHub o Discord
        if (cause.status === 401) return cause.message;
    }
    return 'Credenciales incorrectas';
}

export function useLogin() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithCredentials, isAuthenticated, isLoading } = useAuth();
    const nextPath = safeDestination(searchParams.get('next'));

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const social = useSocialLogin(nextPath, setError);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace(nextPath);
        }
    }, [isAuthenticated, isLoading, nextPath, router]);

    useEffect(() => {
        if (sessionStorage.getItem(REGISTRATION_SUCCESS_KEY)) {
            setSuccess('Cuenta creada. Inicia sesión.');
            sessionStorage.removeItem(REGISTRATION_SUCCESS_KEY);
        }
        if (sessionStorage.getItem(PASSWORD_RESET_SUCCESS_KEY)) {
            setSuccess('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
            sessionStorage.removeItem(PASSWORD_RESET_SUCCESS_KEY);
        }
    }, []);

    const submit = async () => {
        setError(null);
        setSubmitting(true);
        try {
            await loginWithCredentials(email, password, nextPath);
        } catch (cause) {
            setError(loginErrorMessage(cause));
        } finally {
            setSubmitting(false);
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        submitting,
        busy: submitting || social.loadingProvider !== null || isLoading,
        error,
        success,
        submit,
        socialProvider: social.loadingProvider,
        signInWith: social.signIn
    };
}
