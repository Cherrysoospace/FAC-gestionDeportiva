import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { fetchTwoFactorStatus, updateTwoFactor } from '@/lib/two-factor-api';
import { ActionResult } from '@/types/action';
import { TwoFactorStatus } from '@/types/two-factor';

// Estado del 2FA del usuario autenticado y su cambio (HU-SE-10)
export function useTwoFactorSettings() {
    const [status, setStatus] = useState<TwoFactorStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        fetchTwoFactorStatus(controller.signal)
            .then(setStatus)
            .catch((cause) => {
                if (!controller.signal.aborted) setLoadError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, []);

    const changeStatus = useCallback(async (enabled: boolean, currentPassword: string): Promise<ActionResult> => {
        if (!currentPassword) return { ok: false, error: 'Escribe tu contraseña actual para confirmar.' };

        setSaving(true);
        try {
            setStatus(await updateTwoFactor(enabled, currentPassword));
            return { ok: true };
        } catch (cause) {
            return { ok: false, error: describeError(cause) };
        } finally {
            setSaving(false);
        }
    }, []);

    return { status, loading, loadError, saving, changeStatus };
}
