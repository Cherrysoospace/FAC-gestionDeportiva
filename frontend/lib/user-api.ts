import { apiFetch, ApiRequestError } from './api';
import { PersonalDataInput } from '@/types/profile';
import { UserAccount, UserFormValues, UserProfileData, UserWithRoles } from '@/types/security';

export function fetchUsers(signal?: AbortSignal): Promise<UserAccount[]> {
    return apiFetch<UserAccount[]>('/api/users', { signal });
}

export function fetchUser(userId: number, signal?: AbortSignal): Promise<UserAccount> {
    return apiFetch<UserAccount>(`/api/users/${userId}`, { signal });
}

export function fetchUserWithRoles(
    userId: number,
    signal?: AbortSignal
): Promise<UserWithRoles> {
    return apiFetch<UserWithRoles>(`/api/users/${userId}/detail-with-roles`, {
        signal
    });
}

export function createUser(values: UserFormValues): Promise<UserAccount> {
    return apiFetch<UserAccount>('/api/users', {
        method: 'POST',
        body: JSON.stringify(values)
    });
}

export function updateUser(userId: number, values: UserFormValues): Promise<UserAccount> {
    const { password, ...basicData } = values;

    return apiFetch<UserAccount>(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(password ? values : basicData)
    });
}

/** Desactiva el usuario (el backend no lo borra). */
export function deactivateUser(userId: number): Promise<void> {
    return apiFetch<void>(`/api/users/${userId}`, { method: 'DELETE' });
}

export function reactivateUser(userId: number): Promise<UserAccount> {
    return apiFetch<UserAccount>(`/api/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: true })
    });
}

/** Perfil del usuario, o null si todavía no tiene uno. */
export async function fetchUserProfile(userId: number, signal?: AbortSignal): Promise<UserProfileData | null> {
    try {
        return await apiFetch<UserProfileData>(`/api/users/${userId}/profile`, { signal });
    } catch (cause) {
        if (cause instanceof ApiRequestError && cause.status === 404) return null;
        throw cause;
    }
}

export function saveUserProfile(userId: number, data: PersonalDataInput, exists: boolean): Promise<UserProfileData> {
    return apiFetch<UserProfileData>(`/api/users/${userId}/profile`, {
        method: exists ? 'PUT' : 'POST',
        body: JSON.stringify(data)
    });
}
