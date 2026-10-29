'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { validatePhone } from '@/lib/profile-rules';
import { deactivateUser, fetchUser, fetchUserProfile, reactivateUser, saveUserProfile, updateUser } from '@/lib/user-api';
import { ActionResult } from '@/types/action';
import { PersonalDataInput } from '@/types/profile';
import { UserAccount, UserFormValues, UserProfileData } from '@/types/security';

export function useUserDetail(userId: number) {
    const [user, setUser] = useState<UserAccount | null>(null);
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);

        Promise.all([fetchUser(userId, controller.signal), fetchUserProfile(userId, controller.signal)])
            .then(([account, profileData]) => {
                setUser(account);
                setProfile(profileData);
            })
            .catch((cause) => {
                if (!controller.signal.aborted) setLoadError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [userId, reloadKey]);

    const run = useCallback(async (action: () => Promise<void>): Promise<ActionResult> => {
        try {
            await action();
            return { ok: true };
        } catch (cause) {
            return { ok: false, error: describeError(cause) };
        }
    }, []);

    const update = useCallback((values: UserFormValues) => run(async () => setUser(await updateUser(userId, values))), [run, userId]);

    const setEnabled = useCallback(
        (enabled: boolean) =>
            run(async () => {
                if (enabled) {
                    setUser(await reactivateUser(userId));
                } else {
                    await deactivateUser(userId);
                    setUser((current) => (current ? { ...current, enabled: false } : current));
                }
            }),
        [run, userId]
    );

    const saveProfile = useCallback(
        async (data: PersonalDataInput): Promise<ActionResult> => {
            const phoneError = validatePhone(data.phone);
            if (phoneError) return { ok: false, error: phoneError };

            setSavingProfile(true);
            const result = await run(async () => setProfile(await saveUserProfile(userId, { ...data, phone: data.phone.trim() }, profile !== null)));
            setSavingProfile(false);
            return result;
        },
        [run, userId, profile]
    );

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    return { user, profile, loading, loadError, savingProfile, update, setEnabled, saveProfile, reload };
}
