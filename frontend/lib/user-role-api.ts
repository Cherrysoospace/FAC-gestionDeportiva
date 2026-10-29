import { apiFetch } from './api';
import { UserRoleAssignment } from '@/types/security';

export function assignRoleToUser(
    userId: number,
    roleId: number
): Promise<UserRoleAssignment> {
    return apiFetch<UserRoleAssignment>('/api/user-roles', {
        method: 'POST',
        body: JSON.stringify({ userId, roleId })
    });
}

export function removeRoleFromUser(
    userId: number,
    roleId: number
): Promise<void> {
    return apiFetch<void>(`/api/user-roles/${userId}/${roleId}`, {
        method: 'DELETE'
    });
}
