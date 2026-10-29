import { apiFetch } from './api';
import { UserSummary } from '@/types/security';

export function fetchUsers(signal?: AbortSignal): Promise<UserSummary[]> {
    return apiFetch<UserSummary[]>('/api/users', { signal });
}
