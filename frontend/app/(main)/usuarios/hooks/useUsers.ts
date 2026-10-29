'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { fetchUsers } from '@/lib/user-api';
import { UserSummary } from '@/types/security';

export function useUsers() {
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        fetchUsers(controller.signal)
            .then((data) =>
                setUsers(
                    [...data].sort((first, second) =>
                        first.name.localeCompare(second.name)
                    )
                )
            )
            .catch((cause) => {
                if (!controller.signal.aborted) {
                    setError(describeError(cause));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    return { users, loading, error, reload };
}
