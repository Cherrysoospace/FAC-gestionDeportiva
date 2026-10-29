'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { createUser, deactivateUser, fetchUsers, reactivateUser, updateUser } from '@/lib/user-api';
import { ActionResult } from '@/types/action';
import { UserAccount, UserFormValues } from '@/types/security';

const byName = (first: UserAccount, second: UserAccount) => first.name.localeCompare(second.name);

export function useUsers() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        fetchUsers(controller.signal)
            .then((data) => setUsers([...data].sort(byName)))
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

    const upsertLocal = useCallback((saved: UserAccount) => {
        setUsers((current) => [...current.filter((user) => user.id !== saved.id), saved].sort(byName));
    }, []);

    const run = useCallback(async (action: () => Promise<void>): Promise<ActionResult> => {
        try {
            await action();
            return { ok: true };
        } catch (cause) {
            return { ok: false, error: describeError(cause) };
        }
    }, []);

    const create = useCallback((values: UserFormValues) => run(async () => upsertLocal(await createUser(values))), [run, upsertLocal]);

    const update = useCallback((userId: number, values: UserFormValues) => run(async () => upsertLocal(await updateUser(userId, values))), [run, upsertLocal]);

    const setEnabled = useCallback(
        (user: UserAccount, enabled: boolean) =>
            run(async () => {
                if (enabled) {
                    upsertLocal(await reactivateUser(user.id));
                } else {
                    await deactivateUser(user.id);
                    upsertLocal({ ...user, enabled: false });
                }
            }),
        [run, upsertLocal]
    );

    return { users, loading, error, reload, create, update, setEnabled };
}
