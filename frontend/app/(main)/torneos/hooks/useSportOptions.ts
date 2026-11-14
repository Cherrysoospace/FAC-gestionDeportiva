'use client';

import { useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { listSports } from '@/lib/sports-catalog-api';
import { Sport } from '@/types/sports';

/**
 * Deportes activos para los selectores. `enabled` = el usuario tiene
 * GET /gestion-deportiva/sports; si no, no se consulta.
 */
export function useSportOptions(enabled: boolean) {
    const [sports, setSports] = useState<Sport[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listSports({ active: true }, controller.signal)
            .then(setSports)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [enabled]);

    return { sports, loading, error };
}
