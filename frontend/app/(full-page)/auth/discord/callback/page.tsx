'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuth } from '../../../../../layout/context/authcontext';
import { ApiRequestError } from '../../../../../lib/api';

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
            setError('Estado OAuth inválido. Intenta de nuevo.');
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

    return (
        <div className="surface-ground flex flex-column align-items-center justify-content-center min-h-screen gap-3 p-4">
            {error ? (
                <>
                    <Message severity="error" text={error} />
                    <Button label="Volver al login" onClick={() => router.replace('/auth/login')} />
                </>
            ) : (
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} />
            )}
        </div>
    );
};

export default function DiscordCallbackPage() {
    return (
        <Suspense fallback={null}>
            <DiscordCallbackContent />
        </Suspense>
    );
}
