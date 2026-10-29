import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { fetchMyProfile, removeMyProfilePhoto, updateMyProfile, uploadMyProfilePhoto } from '@/lib/profile-api';
import { validatePhone, validateProfilePhoto } from '@/lib/profile-rules';
import { ActionResult } from '@/types/action';
import { MyProfile, PersonalDataInput } from '@/types/profile';

export function useMyProfile() {
    const [profile, setProfile] = useState<MyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [photoBusy, setPhotoBusy] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);

        fetchMyProfile(controller.signal)
            .then(setProfile)
            .catch((cause) => {
                if (!controller.signal.aborted) setLoadError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [reloadKey]);

    const run = useCallback(async (setBusy: (busy: boolean) => void, action: () => Promise<MyProfile>): Promise<ActionResult> => {
        setBusy(true);
        try {
            setProfile(await action());
            return { ok: true };
        } catch (cause) {
            return { ok: false, error: describeError(cause) };
        } finally {
            setBusy(false);
        }
    }, []);

    const savePersonalData = useCallback(
        (data: PersonalDataInput): Promise<ActionResult> => {
            const phoneError = validatePhone(data.phone);
            if (phoneError) return Promise.resolve({ ok: false, error: phoneError });

            return run(setSaving, () => updateMyProfile({ ...data, phone: data.phone.trim() }));
        },
        [run]
    );

    const uploadPhoto = useCallback(
        (file: File): Promise<ActionResult> => {
            const photoError = validateProfilePhoto(file);
            if (photoError) return Promise.resolve({ ok: false, error: photoError });

            return run(setPhotoBusy, () => uploadMyProfilePhoto(file));
        },
        [run]
    );

    const removePhoto = useCallback((): Promise<ActionResult> => run(setPhotoBusy, removeMyProfilePhoto), [run]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    return { profile, loading, loadError, saving, photoBusy, savePersonalData, uploadPhoto, removePhoto, reload };
}
