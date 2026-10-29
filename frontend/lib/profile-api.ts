import { apiFetch } from './api';
import { MyProfile, PersonalDataInput } from '@/types/profile';

const MY_PROFILE = '/api/profile/me';

export function fetchMyProfile(signal?: AbortSignal): Promise<MyProfile> {
    return apiFetch<MyProfile>(MY_PROFILE, { signal });
}

export function updateMyProfile(data: PersonalDataInput): Promise<MyProfile> {
    return apiFetch<MyProfile>(MY_PROFILE, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export function uploadMyProfilePhoto(file: File): Promise<MyProfile> {
    const body = new FormData();
    body.append('file', file);

    return apiFetch<MyProfile>(`${MY_PROFILE}/photo`, { method: 'PUT', body });
}

export function removeMyProfilePhoto(): Promise<MyProfile> {
    return apiFetch<MyProfile>(`${MY_PROFILE}/photo`, { method: 'DELETE' });
}
