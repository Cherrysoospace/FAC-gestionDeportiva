import { useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { requestPasswordReset } from '@/lib/password-recovery-api';

export type ForgotPasswordStatus = 'idle' | 'sending' | 'sent';

export function useForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<ForgotPasswordStatus>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        setError(null);
        setStatus('sending');
        try {
            const response = await requestPasswordReset(email.trim());
            setMessage(response.message);
            setStatus('sent');
        } catch (cause) {
            setError(describeError(cause));
            setStatus('idle');
        }
    };

    return { email, setEmail, status, message, error, submit };
}
