import { apiFetch } from './api';
import {
    CurrentUser,
    PermissionCatalog,
    RoleAccessSummary,
    RolePermissionsAssignment,
    RoleSummary
} from '@/types/security';

export function fetchCurrentUser(): Promise<CurrentUser> {
    return apiFetch<CurrentUser>('/api/auth/me');
}

export function fetchRoles(): Promise<RoleSummary[]> {
    return apiFetch<RoleSummary[]>('/api/roles');
}

export function fetchPermissionCatalog(): Promise<PermissionCatalog> {
    return apiFetch<PermissionCatalog>('/api/permissions/catalog');
}

export function fetchRolePermissions(
    roleId: number
): Promise<RolePermissionsAssignment> {
    return apiFetch<RolePermissionsAssignment>(
        `/api/roles/${roleId}/permissions`
    );
}

export function fetchRoleSummary(roleId: number): Promise<RoleAccessSummary> {
    return apiFetch<RoleAccessSummary>(`/api/roles/${roleId}/summary`);
}

export function updateRolePermissions(
    roleId: number,
    permissionIds: number[]
): Promise<RolePermissionsAssignment> {
    return apiFetch<RolePermissionsAssignment>(
        `/api/roles/${roleId}/permissions`,
        {
            method: 'PUT',
            body: JSON.stringify({ permissionIds })
        }
    );
}
