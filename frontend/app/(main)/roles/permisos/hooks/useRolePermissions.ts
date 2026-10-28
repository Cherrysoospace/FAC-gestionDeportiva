'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiRequestError } from '@/lib/api';
import {
    fetchPermissionCatalog,
    fetchRolePermissions,
    fetchRoleSummary,
    fetchRoles,
    updateRolePermissions
} from '@/lib/security-api';
import {
    PermissionCatalog,
    PermissionItem,
    RoleAccessSummary,
    RolePermissionsAssignment,
    RoleSummary
} from '@/types/security';

function setsEqual(first: Set<number>, second: Set<number>): boolean {
    if (first.size !== second.size) {
        return false;
    }

    return Array.from(first).every((value) => second.has(value));
}

function sortRoles(roles: RoleSummary[]): RoleSummary[] {
    const sorted = [...roles].sort((first, second) =>
        first.name.localeCompare(second.name)
    );
    const adminIndex = sorted.findIndex(
        (role) => role.name.toUpperCase() === 'ADMIN'
    );

    if (adminIndex > 0) {
        const [admin] = sorted.splice(adminIndex, 1);
        sorted.unshift(admin);
    }

    return sorted;
}

function describeError(cause: unknown): string {
    if (cause instanceof ApiRequestError) {
        if (cause.status === 403) {
            return 'No tienes permisos para realizar esta operación.';
        }
        if (cause.status === 401) {
            return 'Tu sesión expiró. Inicia sesión nuevamente.';
        }
        if (cause.status === 0) {
            return 'No se pudo conectar con el servidor.';
        }
        return cause.message || 'Ocurrió un error inesperado.';
    }

    return 'Ocurrió un error inesperado.';
}

export function useRolePermissions() {
    const [roles, setRoles] = useState<RoleSummary[]>([]);
    const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [assignment, setAssignment] =
        useState<RolePermissionsAssignment | null>(null);
    const [summary, setSummary] = useState<RoleAccessSummary | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
    const [initialLoading, setInitialLoading] = useState(true);
    const [roleLoading, setRoleLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const loadRole = useCallback(async (roleId: number) => {
        setRoleLoading(true);
        setLoadError(null);

        try {
            const [assignmentData, summaryData] = await Promise.all([
                fetchRolePermissions(roleId),
                fetchRoleSummary(roleId)
            ]);

            setAssignment(assignmentData);
            setSummary(summaryData);
            setSelectedRoleId(roleId);

            const ids = new Set(assignmentData.permissionIds);
            setSelectedIds(new Set(ids));
            setSavedIds(new Set(ids));
            setSaveError(null);

            return true;
        } catch (cause) {
            setLoadError(describeError(cause));
            return false;
        } finally {
            setRoleLoading(false);
        }
    }, []);

    const initialize = useCallback(async () => {
        setInitialLoading(true);
        setLoadError(null);

        try {
            const [rolesData, catalogData] = await Promise.all([
                fetchRoles(),
                fetchPermissionCatalog()
            ]);

            const sortedRoles = sortRoles(rolesData);
            setRoles(sortedRoles);
            setCatalog(catalogData);

            const preferredRole =
                sortedRoles.find((role) => role.active) ?? sortedRoles[0];

            if (preferredRole) {
                await loadRole(preferredRole.id);
            } else {
                setSelectedRoleId(null);
                setAssignment(null);
                setSummary(null);
                setSelectedIds(new Set());
                setSavedIds(new Set());
            }
        } catch (cause) {
            setLoadError(describeError(cause));
        } finally {
            setInitialLoading(false);
        }
    }, [loadRole]);

    useEffect(() => {
        void initialize();
    }, [initialize]);

    const reloadRole = useCallback(async () => {
        if (selectedRoleId === null) {
            return false;
        }

        return loadRole(selectedRoleId);
    }, [loadRole, selectedRoleId]);

    const togglePermissions = useCallback(
        (permissionIds: number[], checked: boolean) => {
            setSelectedIds((current) => {
                const next = new Set(current);

                permissionIds.forEach((permissionId) => {
                    if (checked) {
                        next.add(permissionId);
                    } else {
                        next.delete(permissionId);
                    }
                });

                return next;
            });
            setSaveError(null);
        },
        []
    );

    const reset = useCallback(() => {
        setSelectedIds(new Set(savedIds));
        setSaveError(null);
    }, [savedIds]);

    const save = useCallback(async (): Promise<boolean> => {
        if (selectedRoleId === null) {
            return false;
        }

        setSaving(true);
        setSaveError(null);

        try {
            const result = await updateRolePermissions(
                selectedRoleId,
                Array.from(selectedIds)
            );

            setAssignment(result);

            const persistedIds = new Set(result.permissionIds);
            setSavedIds(persistedIds);
            setSelectedIds(new Set(persistedIds));

            try {
                setSummary(await fetchRoleSummary(selectedRoleId));
            } catch {
                // El guardado ya se completó; el resumen se actualizará en la
                // próxima recarga.
            }

            return true;
        } catch (cause) {
            setSaveError(describeError(cause));
            return false;
        } finally {
            setSaving(false);
        }
    }, [selectedRoleId, selectedIds]);

    const permissionById = useMemo(() => {
        const map = new Map<number, PermissionItem>();

        for (const permissionModule of catalog?.modules ?? []) {
            for (const resource of permissionModule.resources) {
                for (const permission of resource.permissions) {
                    map.set(permission.id, permission);
                }
            }
        }

        return map;
    }, [catalog]);

    const selectedItems = useMemo(
        () =>
            Array.from(selectedIds)
                .map((id) => permissionById.get(id))
                .filter((item): item is PermissionItem => Boolean(item)),
        [permissionById, selectedIds]
    );

    const localModules = useMemo(
        () => Array.from(new Set(selectedItems.map((item) => item.module))),
        [selectedItems]
    );

    const totalAvailable = catalog?.total ?? 0;
    const assignedCount = selectedIds.size;
    const notAssigned = Math.max(totalAvailable - assignedCount, 0);
    const dirty = !setsEqual(selectedIds, savedIds);

    const selectedRole =
        roles.find((role) => role.id === selectedRoleId) ?? null;

    return {
        roles,
        catalog,
        selectedRoleId,
        selectedRole,
        assignment,
        summary,
        selectedIds,
        savedIds,
        initialLoading,
        roleLoading,
        saving,
        loadError,
        saveError,
        dirty,
        loading: initialLoading || roleLoading,
        totalAvailable,
        assignedCount,
        notAssigned,
        localModules,
        selectRole: loadRole,
        reloadRole,
        reloadAll: initialize,
        togglePermissions,
        reset,
        save
    };
}
