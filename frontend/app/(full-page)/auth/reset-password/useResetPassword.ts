import { useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api';
import { describeError } from '@/lib/api-errors';
import { resetPassword, validateResetToken } from '@/lib/password-recovery-api';
import { unmetPasswordRules } from '@/lib/password-rules';

export type ResetPasswordStatus = 'validating' | 'invalid' | 'ready' | 'saving';

const INVALID_LINK = 'El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.';

function linkError(cause: unknown): string {
    return cause instanceof ApiRequestError && cause.status === 400 ? INVALID_LINK : describeError(cause);
}

export function useResetPassword(token: string | null, onSuccess: () => void) {
    const [status, setStatus] = useState<ResetPasswordStatus>('validating');
    const [newPassword, setNewPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError(INVALID_LINK);
            setStatus('invalid');
            return;
        }

        const controller = new AbortController();
        validateResetToken(token, controller.signal)
            .then(() => setStatus('ready'))
            .catch((cause) => {
                if (controller.signal.aborted) return;
                setError(linkError(cause));
                setStatus('invalid');
            });

        return () => controller.abort();
    }, [token]);

    const unmetRules = unmetPasswordRules(newPassword);
    const passwordsMatch = newPassword === confirmation;
    const canSubmit = status === 'ready' && unmetRules.length === 0 && passwordsMatch && confirmation.length > 0;

    const submit = async () => {
        if (!token || !canSubmit) return;

        setError(null);
        setStatus('saving');
        try {
            await resetPassword(token, newPassword);
            onSuccess();
        } catch (cause) {
            const isLinkProblem = cause instanceof ApiRequestError && cause.errorCase === 'INVALID_OPERATION';
            setError(isLinkProblem ? INVALID_LINK : describeError(cause));
            setStatus(isLinkProblem ? 'invalid' : 'ready');
        }
    };

    return {
        status,
        newPassword,
        setNewPassword,
        confirmation,
        setConfirmation,
        unmetRules,
        passwordsMatch,
        canSubmit,
        error,
        submit
    };
}
