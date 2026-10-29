'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAuth } from '../../../../../layout/context/authcontext';
import { ApiRequestError } from '../../../../../lib/api';
import AuthCard from '../../components/AuthCard';
import AuthLoading from '../../components/AuthLoading';

const DiscordCallbackContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithDiscord } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) {
            return;
        }
        started.current = true;

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const expectedState = sessionStorage.getItem('discordOAuthState');
        const next = sessionStorage.getItem('discordOAuthNext') || '/';
        sessionStorage.removeItem('discordOAuthState');
        sessionStorage.removeItem('discordOAuthNext');

        if (searchParams.get('error') || !code) {
            setError('Se canceló el inicio de sesión con Discord');
            return;
        }
        if (!state || state !== expectedState) {
            setError('La solicitud de inicio de sesión no es válida o expiró. Intenta de nuevo.');
            return;
        }

        const safeNext =
            next.startsWith('/') && !next.startsWith('//') && !next.includes('\\')
                ? next
                : '/';

        loginWithDiscord(
            code,
            `${window.location.origin}/auth/discord/callback`,
            safeNext
        ).catch((cause) => {
            setError(
                cause instanceof ApiRequestError
                    ? cause.message
                    : 'No se pudo iniciar sesión con Discord'
            );
        });
    }, [searchParams, loginWithDiscord]);

    if (!error) {
        return <AuthLoading message="Conectando con Discord…" />;
    }

    return (
        <AuthCard icon="pi-discord" tone="danger" title="No pudimos iniciar sesión" subtitle={error}>
            <Button icon="pi pi-arrow-left" label="Volver a iniciar sesión" className="w-full" onClick={() => router.replace('/auth/login')} />
        </AuthCard>
    );
};

export default function DiscordCallbackPage() {
    return (
        <Suspense fallback={<AuthLoading message="Conectando con Discord…" />}>
            <DiscordCallbackContent />
        </Suspense>
    );
}
