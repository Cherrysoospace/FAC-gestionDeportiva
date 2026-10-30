'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/layout/context/authcontext';
import { ApiRequestError } from '@/lib/api';
import { describeError } from '@/lib/api-errors';
import { resendTwoFactorCode } from '@/lib/two-factor-api';
import { TwoFactorChallenge } from '@/types/two-factor';

export const TWO_FACTOR_MIN_LENGTH = 6;
export const TWO_FACTOR_MAX_LENGTH = 10;

function verifyErrorMessage(cause: unknown): string {
    if (cause instanceof ApiRequestError && cause.status === 403) {
        return 'Tu usuario está deshabilitado';
    }
    return describeError(cause);
}

// Reloj que avanza cada segundo para la cuenta regresiva del reenvío
function useNow(): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(interval);
    }, []);

    return now;
}

export function useTwoFactorStep(initialChallenge: TwoFactorChallenge, nextPath: string) {
    const { completeTwoFactorLogin } = useAuth();
    const now = useNow();

    const [challenge, setChallenge] = useState(initialChallenge);
    const [code, setCodeValue] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const expired = new Date(challenge.expiresAt).getTime() <= now;
    const resendInSeconds = Math.max(0, Math.ceil((new Date(challenge.resendAvailableAt).getTime() - now) / 1000));
    const canVerify = code.length >= TWO_FACTOR_MIN_LENGTH && !expired && !verifying;

    // Solo dígitos: así el usuario puede pegar el código con espacios
    const setCode = (value: string) => setCodeValue(value.replace(/\D/g, '').slice(0, TWO_FACTOR_MAX_LENGTH));

    const verify = async () => {
        if (!canVerify) return;

        setError(null);
        setInfo(null);
        setVerifying(true);
        try {
            await completeTwoFactorLogin(challenge.challengeId, code, nextPath);
        } catch (cause) {
            setError(verifyErrorMessage(cause));
            setCodeValue('');
        } finally {
            setVerifying(false);
        }
    };

    const resend = async () => {
        if (resendInSeconds > 0 || resending) return;

        setError(null);
        setInfo(null);
        setResending(true);
        try {
            setChallenge(await resendTwoFactorCode(challenge.challengeId));
            setCodeValue('');
            setInfo('Te enviamos un código nuevo.');
        } catch (cause) {
            setError(describeError(cause));
        } finally {
            setResending(false);
        }
    };

    return {
        destination: challenge.destination,
        expiresAt: challenge.expiresAt,
        code,
        setCode,
        expired,
        canVerify,
        verifying,
        resending,
        resendInSeconds,
        error,
        info,
        verify,
        resend
    };
}
