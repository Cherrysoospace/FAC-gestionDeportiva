'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import PageHeader from '@/components/ui/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { describeError } from '@/lib/api-errors';
import { getInitials } from '@/lib/format';
import {
    assignUserToRole,
    fetchAllUsers,
    fetchRoles,
    fetchRoleUsers,
    removeUserFromRole
} from '@/lib/security-api';
import {
    ROLE_USERS_VIEW_ENDPOINTS,
    USER_ROLE_ASSIGN_ENDPOINT,
    USER_ROLE_REMOVE_ENDPOINT
} from '@/lib/security-constants';
import { RoleSummary, RoleUserItem, UserAccount } from '@/types/security';

interface RoleUsersPageProps {
    params: { id: string };
}

export default function RoleUsersPage({ params }: RoleUsersPageProps) {
    const roleId = Number(params.id);

    return (
        <ProtectedRoute requiredEndpoints={ROLE_USERS_VIEW_ENDPOINTS}>
            {!Number.isInteger(roleId) || roleId <= 0 ? (
                <div className="card">
                    <EmptyState
                        icon="pi-shield"
                        title="Rol no válido"
                        description="El identificador del rol no es válido."
                    />
                </div>
            ) : (
                <RoleUsersContent initialRoleId={roleId} />
            )}
        </ProtectedRoute>
    );
}

function RoleUsersContent({ initialRoleId }: { initialRoleId: number }) {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl, refreshPermissions, user: currentUser } =
        useAuth();

    const [roles, setRoles] = useState<RoleSummary[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<number>(initialRoleId);
    const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
    const [roleUsers, setRoleUsers] = useState<RoleUserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleLoading, setRoleLoading] = useState(false);
    const [pendingUserIds, setPendingUserIds] = useState<Set<number>>(
        new Set()
    );
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusBanner, setStatusBanner] = useState<string | null>(null);

    const canAssign = hasPermissionUrl(
        USER_ROLE_ASSIGN_ENDPOINT.url,
        USER_ROLE_ASSIGN_ENDPOINT.method
    );
    const canRemove = hasPermissionUrl(
        USER_ROLE_REMOVE_ENDPOINT.url,
        USER_ROLE_REMOVE_ENDPOINT.method
    );

    const loadRoleAssociations = useCallback(async (targetRoleId: number) => {
        setRoleLoading(true);
        setError(null);
        try {
            const assigned = await fetchRoleUsers(targetRoleId);
            setRoleUsers(assigned);
        } catch (cause) {
            setError(describeError(cause));
        } finally {
            setRoleLoading(false);
        }
    }, []);

    const initialize = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [rolesData, usersData, assignedData] = await Promise.all([
                fetchRoles(),
                fetchAllUsers(),
                fetchRoleUsers(selectedRoleId)
            ]);
            setRoles(rolesData);
            setAllUsers(usersData);
            setRoleUsers(assignedData);
        } catch (cause) {
            setError(describeError(cause));
        } finally {
            setLoading(false);
        }
    }, [selectedRoleId]);

    useEffect(() => {
        void initialize();
    }, [initialize]);

    const selectedRole = useMemo(
        () => roles.find((role) => role.id === selectedRoleId) ?? null,
        [roles, selectedRoleId]
    );

    const assignedUserIdSet = useMemo(
        () => new Set(roleUsers.map((item) => item.user.id)),
        [roleUsers]
    );

    const assignedUsers = useMemo(
        () => roleUsers.map((item) => item.user),
        [roleUsers]
    );

    const availableUsers = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        // Cuando no hay búsqueda mostramos primero los disponibles (y si hay pocos usuarios, también los ya asociados con aviso como en HU-GD-03)
        return allUsers.filter((candidate) => {
            if (!term) {
                return true;
            }
            return (
                candidate.name.toLowerCase().includes(term) ||
                candidate.email.toLowerCase().includes(term)
            );
        });
    }, [allUsers, searchQuery]);

    const handleRoleSelect = (nextRoleId: number) => {
        if (nextRoleId === selectedRoleId) return;
        setSelectedRoleId(nextRoleId);
        setStatusBanner(null);
        void loadRoleAssociations(nextRoleId);
    };

    const setUserPending = (userId: number, pending: boolean) => {
        setPendingUserIds((previous) => {
            const next = new Set(previous);
            if (pending) {
                next.add(userId);
            } else {
                next.delete(userId);
            }
            return next;
        });
    };

    const handleAssignUser = async (targetUser: UserAccount) => {
        if (assignedUserIdSet.has(targetUser.id)) {
            return;
        }

        setUserPending(targetUser.id, true);
        try {
            await assignUserToRole(targetUser.id, selectedRoleId);
            await loadRoleAssociations(selectedRoleId);
            setStatusBanner(`${targetUser.name} asociado correctamente.`);
            toast.current?.show({
                severity: 'success',
                summary: 'Usuario asociado',
                detail: `${targetUser.name} ahora tiene el rol «${selectedRole?.name ?? ''}».`,
                life: 3000
            });
            if (currentUser?.id === targetUser.id) {
                void refreshPermissions();
            }
        } catch (cause) {
            toast.current?.show({
                severity: 'error',
                summary: 'No se pudo asociar el usuario',
                detail: describeError(cause),
                life: 5000
            });
        } finally {
            setUserPending(targetUser.id, false);
        }
    };

    const confirmRemoveUser = (targetUser: UserAccount) => {
        confirmDialog({
            header: 'Retirar asociación de rol',
            icon: 'pi pi-exclamation-triangle',
            message: (
                <div className="flex flex-column gap-2 line-height-3">
                    <span>
                        ¿Deseas retirar a <strong>{targetUser.name}</strong> del
                        rol{' '}
                        <strong>{selectedRole?.name ?? 'seleccionado'}</strong>?
                    </span>
                    <span className="text-600 text-sm">
                        Retirar el rol no elimina al usuario ni al rol del
                        sistema; únicamente se retira la asociación y sus
                        permisos efectivos se actualizarán.
                    </span>
                </div>
            ),
            acceptLabel: 'Retirar asociación',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                setUserPending(targetUser.id, true);
                try {
                    await removeUserFromRole(targetUser.id, selectedRoleId);
                    await loadRoleAssociations(selectedRoleId);
                    setStatusBanner(
                        `Se retiró la asociación de ${targetUser.name}.`
                    );
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Asociación retirada',
                        detail: `${targetUser.name} ya no pertenece al rol «${selectedRole?.name ?? ''}».`,
                        life: 3000
                    });
                    if (currentUser?.id === targetUser.id) {
                        void refreshPermissions();
                    }
                } catch (cause) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'No se pudo retirar la asociación',
                        detail: describeError(cause),
                        life: 5000
                    });
                } finally {
                    setUserPending(targetUser.id, false);
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="card">
                <LoadingState message="Cargando rol y usuarios…" />
            </div>
        );
    }

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />

            <PageHeader
                title="Asociar usuarios con roles"
                subtitle="Define las personas que tienen asignado cada rol dentro de la plataforma."
                breadcrumb={[
                    { label: 'Inicio', href: '/' },
                    { label: 'Roles', href: '/roles' },
                    { label: selectedRole?.name ?? 'Rol' },
                    { label: 'Usuarios' }
                ]}
                actions={
                    <div className="flex gap-2">
                        <Button
                            label="Matriz de permisos"
                            icon="pi pi-key"
                            outlined
                            onClick={() =>
                                router.push(
                                    `/roles/permisos?roleId=${selectedRoleId}`
                                )
                            }
                        />
                        <Button
                            label="Volver a roles"
                            icon="pi pi-arrow-left"
                            text
                            onClick={() => router.push('/roles')}
                        />
                    </div>
                }
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button
                        label="Reintentar"
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => void initialize()}
                    />
                </div>
            )}

            <div className="grid align-items-end mb-3">
                <div className="col-12 lg:col-6">
                    <div className="flex flex-column gap-2">
                        <label
                            htmlFor="role-users-selector"
                            className="text-primary font-semibold text-sm"
                        >
                            Seleccionar rol
                        </label>
                        <Dropdown
                            inputId="role-users-selector"
                            value={selectedRoleId}
                            options={roles}
                            optionLabel="name"
                            optionValue="id"
                            filter
                            filterBy="name"
                            className="w-full md:w-26rem"
                            disabled={roleLoading}
                            onChange={(event) =>
                                event.value && handleRoleSelect(event.value)
                            }
                            valueTemplate={(role: RoleSummary | null) =>
                                role ? (
                                    <div className="flex align-items-center gap-3 py-1">
                                        <span className="inline-flex align-items-center justify-content-center border-circle bg-primary w-2rem h-2rem">
                                            <i
                                                className="pi pi-shield text-sm"
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <span className="font-bold text-900 text-base">
                                            {role.name}
                                        </span>
                                        <Tag
                                            value={
                                                role.active
                                                    ? 'Activo'
                                                    : 'Inactivo'
                                            }
                                            severity={
                                                role.active
                                                    ? 'success'
                                                    : 'danger'
                                            }
                                        />
                                    </div>
                                ) : (
                                    <span>Selecciona un rol</span>
                                )
                            }
                        />
                    </div>
                </div>

                {statusBanner && (
                    <div className="col-12 lg:col-6">
                        <div className="flex align-items-center justify-content-between p-3 border-round border-1 border-green-500 surface-card">
                            <span className="flex align-items-center gap-2 text-green-500 font-medium text-sm">
                                <i
                                    className="pi pi-check-circle text-lg"
                                    aria-hidden="true"
                                />
                                <span>{statusBanner}</span>
                            </span>
                            <Button
                                icon="pi pi-times"
                                text
                                rounded
                                size="small"
                                aria-label="Cerrar aviso"
                                onClick={() => setStatusBanner(null)}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="grid">
                {/* Cuadro izquierdo: Usuarios disponibles (estructura HU-GD-03.png) */}
                <div className="col-12 lg:col-6">
                    <div className="card h-full flex flex-column justify-content-between gap-3">
                        <div>
                            <div className="flex align-items-center justify-content-between gap-2 mb-3">
                                <div className="flex align-items-center gap-2">
                                    <i
                                        className="pi pi-users text-primary text-lg"
                                        aria-hidden="true"
                                    />
                                    <h5 className="m-0">
                                        Usuarios disponibles
                                    </h5>
                                    <i
                                        className="pi pi-info-circle text-500 text-sm"
                                        title="Selecciona un usuario disponible para asociarlo al rol actual"
                                        aria-hidden="true"
                                    />
                                </div>
                                <Tag
                                    value={`${
                                        allUsers.filter(
                                            (u) => !assignedUserIdSet.has(u.id)
                                        ).length
                                    } disponibles`}
                                    severity="info"
                                />
                            </div>

                            <div className="mb-3">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    ariaLabel="Buscar usuarios"
                                    placeholder="Buscar usuarios..."
                                />
                            </div>

                            {availableUsers.length === 0 ? (
                                <EmptyState
                                    icon="pi-users"
                                    title="Ningún usuario coincide con la búsqueda"
                                    description="Prueba con otro nombre o correo electrónico."
                                />
                            ) : (
                                <div className="grid">
                                    {availableUsers.map((candidate) => {
                                        const isAlreadyAssigned =
                                            assignedUserIdSet.has(candidate.id);
                                        const isPending = pendingUserIds.has(
                                            candidate.id
                                        );

                                        return (
                                            <div
                                                key={candidate.id}
                                                className="col-12 sm:col-6 xl:col-4"
                                            >
                                                <div className="p-3 border-round border-1 surface-border surface-ground h-full flex flex-column align-items-center justify-content-between text-center gap-2">
                                                    <div className="flex flex-column align-items-center gap-2 w-full">
                                                        <Avatar
                                                            label={getInitials(
                                                                candidate.name
                                                            )}
                                                            size="large"
                                                            shape="circle"
                                                            className="bg-primary text-white font-bold"
                                                            aria-hidden="true"
                                                        />
                                                        <span className="font-bold text-900 line-height-2">
                                                            {candidate.name}
                                                        </span>
                                                        <span
                                                            className="text-600 text-xs text-overflow-ellipsis overflow-hidden white-space-nowrap w-full"
                                                            title={
                                                                candidate.email
                                                            }
                                                        >
                                                            {candidate.email}
                                                        </span>
                                                    </div>

                                                    <div className="w-full flex flex-column gap-2 mt-2">
                                                        <Button
                                                            label="Asociar"
                                                            icon="pi pi-plus"
                                                            size="small"
                                                            outlined={
                                                                isAlreadyAssigned
                                                            }
                                                            className="w-full"
                                                            loading={isPending}
                                                            disabled={
                                                                !canAssign ||
                                                                isAlreadyAssigned ||
                                                                isPending ||
                                                                roleLoading
                                                            }
                                                            aria-label={`Asociar a ${candidate.name} al rol ${selectedRole?.name ?? ''}`}
                                                            onClick={() =>
                                                                void handleAssignUser(
                                                                    candidate
                                                                )
                                                            }
                                                        />
                                                        {isAlreadyAssigned && (
                                                            <div className="p-2 border-round border-1 border-yellow-500 surface-card text-left flex align-items-center justify-content-between gap-1">
                                                                <span className="text-xs text-700 line-height-2">
                                                                    Este usuario
                                                                    ya se
                                                                    encuentra
                                                                    asociado al
                                                                    rol.
                                                                </span>
                                                                <i
                                                                    className="pi pi-info-circle text-yellow-500 text-xs"
                                                                    aria-hidden="true"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-round border-1 surface-border surface-ground flex align-items-center gap-2 text-600 text-xs mt-2">
                            <i
                                className="pi pi-info-circle text-primary"
                                aria-hidden="true"
                            />
                            <span>
                                Asocia los usuarios relevantes para que puedan
                                ejecutar los permisos autorizados a este rol.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cuadro derecho: Usuarios asociados (estructura HU-GD-03.png) */}
                <div className="col-12 lg:col-6">
                    <div className="card h-full flex flex-column justify-content-between gap-3">
                        <div>
                            <div className="flex align-items-center gap-2 mb-3">
                                <i
                                    className="pi pi-link text-primary text-lg"
                                    aria-hidden="true"
                                />
                                <h5 className="m-0">Usuarios asociados</h5>
                            </div>

                            <div className="p-3 border-round border-1 surface-border surface-ground flex align-items-center gap-3 mb-3">
                                <span className="text-3xl font-bold text-green-500">
                                    {assignedUsers.length}
                                </span>
                                <span className="text-700 font-medium">
                                    usuarios asociados
                                </span>
                            </div>

                            {assignedUsers.length === 0 ? (
                                <EmptyState
                                    icon="pi-user-plus"
                                    title="Sin usuarios asociados"
                                    description="Usa el botón «+ Asociar» del panel izquierdo para agregar usuarios a este rol."
                                />
                            ) : (
                                <div className="flex flex-column gap-3">
                                    {assignedUsers.map((assignedUser) => {
                                        const isPending = pendingUserIds.has(
                                            assignedUser.id
                                        );

                                        return (
                                            <div
                                                key={assignedUser.id}
                                                className="p-3 border-round border-1 surface-border surface-ground flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-3"
                                            >
                                                <div className="flex align-items-center gap-3">
                                                    <Avatar
                                                        label={getInitials(
                                                            assignedUser.name
                                                        )}
                                                        size="large"
                                                        shape="circle"
                                                        className="bg-primary text-white font-bold flex-shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    <div className="flex flex-column">
                                                        <span className="font-bold text-900">
                                                            {assignedUser.name}
                                                        </span>
                                                        <span className="text-600 text-sm">
                                                            {assignedUser.email}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button
                                                    label="Retirar asociación"
                                                    icon="pi pi-link"
                                                    text
                                                    severity="info"
                                                    loading={isPending}
                                                    disabled={
                                                        !canRemove ||
                                                        isPending ||
                                                        roleLoading
                                                    }
                                                    aria-label={`Retirar asociación de ${assignedUser.name}`}
                                                    onClick={() =>
                                                        confirmRemoveUser(
                                                            assignedUser
                                                        )
                                                    }
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-round border-1 surface-border surface-ground flex align-items-center gap-2 text-600 text-xs mt-2">
                            <i
                                className="pi pi-info-circle text-primary"
                                aria-hidden="true"
                            />
                            <span>
                                Retira una asociación para que el usuario deje
                                de tener los permisos de este rol. Retirar el
                                rol no elimina al usuario ni al rol.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

