'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiRequestError } from '@/lib/api';
import { describeError } from '@/lib/api-errors';
import { fetchRolePermissions, fetchRoles } from '@/lib/security-api';
import { fetchUserWithRoles } from '@/lib/user-api';
import { assignRoleToUser, removeRoleFromUser } from '@/lib/user-role-api';
import { PermissionItem, RoleSummary, UserSummary } from '@/types/security';
import {
    computeAvailableRoles,
    groupPermissionsByModule,
    mergeEffectivePermissions,
    sortRolesByName
} from './userRoles.utils';

export type RoleActionResult = { ok: true } | { ok: false; error: string };

export function useUserRoles(userId: number) {
    const [user, setUser] = useState<UserSummary | null>(null);
    const [allRoles, setAllRoles] = useState<RoleSummary[]>([]);
    const [assignedRoles, setAssignedRoles] = useState<RoleSummary[]>([]);
    // Caché de permisos por rol: al asignar solo se consulta el rol nuevo.
    const [rolePermissions, setRolePermissions] = useState<
        Record<number, PermissionItem[]>
    >({});
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [permissionsError, setPermissionsError] = useState<string | null>(
        null
    );
    const [pendingRoleIds, setPendingRoleIds] = useState<ReadonlySet<number>>(
        new Set()
    );
    const [reloadKey, setReloadKey] = useState(0);
    // Guarda síncrona contra doble clic: el estado se actualiza un render tarde.
    const pendingRef = useRef(new Set<number>());

    useEffect(() => {
        const controller = new AbortController();

        setInitialLoading(true);
        setLoadError(null);
        setPermissionsError(null);
        setRolePermissions({});

        Promise.all([fetchUserWithRoles(userId, controller.signal), fetchRoles()])
            .then(([detail, roles]) => {
                if (controller.signal.aborted) {
                    return;
                }

                setUser({ id: detail.id, name: detail.name, email: detail.email });
                setAssignedRoles(
                    sortRolesByName(detail.roles.map((assignment) => assignment.role))
                );
                setAllRoles(sortRolesByName(roles));
            })
            .catch((cause) => {
                if (!controller.signal.aborted) {
                    setLoadError(describeError(cause));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setInitialLoading(false);
                }
            });

        return () => controller.abort();
    }, [userId, reloadKey]);

    const missingRoleIds = useMemo(
        () =>
            assignedRoles
                .map((role) => role.id)
                .filter((roleId) => !(roleId in rolePermissions)),
        [assignedRoles, rolePermissions]
    );

    useEffect(() => {
        if (missingRoleIds.length === 0) {
            return;
        }

        let active = true;
        setPermissionsError(null);

        Promise.all(
            missingRoleIds.map((roleId) =>
                fetchRolePermissions(roleId).then(
                    (assignment) => [roleId, assignment.permissions] as const
                )
            )
        )
            .then((entries) => {
                if (!active) {
                    return;
                }

                setRolePermissions((current) => {
                    const next = { ...current };
                    entries.forEach(([roleId, permissions]) => {
                        next[roleId] = permissions;
                    });
                    return next;
                });
            })
            .catch((cause) => {
                if (active) {
                    setPermissionsError(describeError(cause));
                }
            });

        return () => {
            active = false;
        };
    }, [missingRoleIds]);

    const runRoleAction = useCallback(
        async (
            roleId: number,
            request: () => Promise<void>
        ): Promise<RoleActionResult> => {
            if (pendingRef.current.has(roleId)) {
                return {
                    ok: false,
                    error: 'Ya hay una operación en curso para este rol.'
                };
            }

            pendingRef.current.add(roleId);
            setPendingRoleIds(new Set(pendingRef.current));

            try {
                await request();
                return { ok: true };
            } catch (cause) {
                return { ok: false, error: describeError(cause) };
            } finally {
                pendingRef.current.delete(roleId);
                setPendingRoleIds(new Set(pendingRef.current));
            }
        },
        []
    );

    const addAssignedRole = useCallback((role: RoleSummary) => {
        setAssignedRoles((current) =>
            current.some((assigned) => assigned.id === role.id)
                ? current
                : sortRolesByName([...current, role])
        );
    }, []);

    const assign = useCallback(
        (role: RoleSummary): Promise<RoleActionResult> => {
            if (assignedRoles.some((assigned) => assigned.id === role.id)) {
                return Promise.resolve({
                    ok: false,
                    error: 'El usuario ya tiene asignado este rol.'
                });
            }

            return runRoleAction(role.id, async () => {
                try {
                    const result = await assignRoleToUser(userId, role.id);
                    addAssignedRole(result.role);
                } catch (cause) {
                    // Otro administrador pudo asignarlo antes: sincronizamos la vista.
                    if (
                        cause instanceof ApiRequestError &&
                        cause.errorCase === 'ALREADY_EXISTS'
                    ) {
                        addAssignedRole(role);
                    }
                    throw cause;
                }
            });
        },
        [assignedRoles, runRoleAction, addAssignedRole, userId]
    );

    const remove = useCallback(
        (role: RoleSummary): Promise<RoleActionResult> =>
            runRoleAction(role.id, async () => {
                await removeRoleFromUser(userId, role.id);
                setAssignedRoles((current) =>
                    current.filter((assigned) => assigned.id !== role.id)
                );
            }),
        [runRoleAction, userId]
    );

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const availableRoles = useMemo(
        () => computeAvailableRoles(allRoles, assignedRoles),
        [allRoles, assignedRoles]
    );

    const effectivePermissions = useMemo(
        () =>
            mergeEffectivePermissions(
                assignedRoles.map((role) => rolePermissions[role.id] ?? [])
            ),
        [assignedRoles, rolePermissions]
    );

    const effectiveModules = useMemo(
        () => groupPermissionsByModule(effectivePermissions),
        [effectivePermissions]
    );

    return {
        user,
        assignedRoles,
        availableRoles,
        effectivePermissions,
        effectiveModules,
        pendingRoleIds,
        initialLoading,
        permissionsLoading: missingRoleIds.length > 0 && !permissionsError,
        loadError,
        permissionsError,
        assign,
        remove,
        reload
    };
}
