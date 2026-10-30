import { apiFetch } from './api';
import {
    CurrentUser,
    PermissionCatalog,
    PermissionFormValues,
    PermissionRecord,
    PermissionRoleAssignment,
    RoleAccessSummary,
    RoleFormValues,
    RolePermissionsAssignment,
    RoleSummary,
    RoleUserItem,
    UserAccount,
    UserRoleAssignment
} from '@/types/security';

export function fetchCurrentUser(): Promise<CurrentUser> {
    return apiFetch<CurrentUser>('/api/auth/me');
}

export function fetchRoles(): Promise<RoleSummary[]> {
    return apiFetch<RoleSummary[]>('/api/roles');
}

export function createRole(values: RoleFormValues): Promise<RoleSummary> {
    return apiFetch<RoleSummary>('/api/roles', {
        method: 'POST',
        body: JSON.stringify(values)
    });
}

export function updateRole(
    id: number,
    values: RoleFormValues
): Promise<RoleSummary> {
    return apiFetch<RoleSummary>(`/api/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(values)
    });
}

export function deleteRole(id: number): Promise<void> {
    return apiFetch<void>(`/api/roles/${id}`, {
        method: 'DELETE'
    });
}

export function fetchRoleUsers(roleId: number): Promise<RoleUserItem[]> {
    return apiFetch<RoleUserItem[]>(`/api/user-roles/roles/${roleId}`);
}

export function fetchAvailableUsersForRole(
    roleId: number
): Promise<UserAccount[]> {
    return apiFetch<UserAccount[]>(
        `/api/user-roles/roles/${roleId}/available-users`
    );
}

export function fetchAllUsers(): Promise<UserAccount[]> {
    return apiFetch<UserAccount[]>('/api/users');
}

export function assignUserToRole(
    userId: number,
    roleId: number
): Promise<UserRoleAssignment> {
    return apiFetch<UserRoleAssignment>('/api/user-roles', {
        method: 'POST',
        body: JSON.stringify({ userId, roleId })
    });
}

export function removeUserFromRole(
    userId: number,
    roleId: number
): Promise<void> {
    return apiFetch<void>(`/api/user-roles/${userId}/${roleId}`, {
        method: 'DELETE'
    });
}

export function fetchPermissions(): Promise<PermissionRecord[]> {
    return apiFetch<PermissionRecord[]>('/api/permissions');
}

export function createPermission(
    values: PermissionFormValues
): Promise<PermissionRecord> {
    return apiFetch<PermissionRecord>('/api/permissions', {
        method: 'POST',
        body: JSON.stringify(values)
    });
}

export function updatePermission(
    id: number,
    values: PermissionFormValues
): Promise<PermissionRecord> {
    return apiFetch<PermissionRecord>(`/api/permissions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(values)
    });
}

export function deletePermission(id: number): Promise<void> {
    return apiFetch<void>(`/api/permissions/${id}`, {
        method: 'DELETE'
    });
}

export function fetchPermissionRoles(
    permissionId: number
): Promise<PermissionRoleAssignment[]> {
    return apiFetch<PermissionRoleAssignment[]>(
        `/api/role-permissions/permissions/${permissionId}`
    );
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
