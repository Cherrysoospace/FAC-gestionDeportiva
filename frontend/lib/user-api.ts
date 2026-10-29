import { apiFetch } from './api';
import { UserSummary, UserWithRoles } from '@/types/security';

export function fetchUsers(signal?: AbortSignal): Promise<UserSummary[]> {
    return apiFetch<UserSummary[]>('/api/users', { signal });
}

export function fetchUserWithRoles(
    userId: number,
    signal?: AbortSignal
): Promise<UserWithRoles> {
    return apiFetch<UserWithRoles>(`/api/users/${userId}/detail-with-roles`, {
        signal
    });
}
