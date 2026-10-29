'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import DualListSelector, { DualListLabels } from '@/components/ui/DualListSelector';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import {
    USER_ROLE_ASSIGN_ENDPOINT,
    USER_ROLE_REMOVE_ENDPOINT,
    USER_ROLES_VIEW_ENDPOINTS
} from '@/lib/security-constants';
import { RoleSummary } from '@/types/security';
import AccessRulesBox from './components/AccessRulesBox';
import EffectivePermissionsPanel from './components/EffectivePermissionsPanel';
import RoleListItem from './components/RoleListItem';
import UserRoleStats from './components/UserRoleStats';
import UserSummaryCard from './components/UserSummaryCard';
import { RoleActionResult, useUserRoles } from './hooks/useUserRoles';

interface UserRolesPageProps {
    params: { id: string };
}

const ROLE_LIST_LABELS: DualListLabels = {
    assignedTitle: 'Roles asignados',
    availableTitle: 'Roles disponibles',
    assignAction: 'Asignar',
    removeAction: 'Retirar',
    emptyAssigned: 'Este usuario aún no tiene roles.',
    emptyAvailable: 'El usuario ya tiene todos los roles disponibles.',
    noMatches: 'Ningún rol coincide con la búsqueda.'
};

const getRoleKey = (role: RoleSummary) => role.id;
const getRoleSearchText = (role: RoleSummary) =>
    `${role.name} ${role.description}`;
const renderRole = (role: RoleSummary) => (
    <RoleListItem
        name={role.name}
        description={role.description}
        active={role.active}
    />
);

function parseUserId(value: string): number | null {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

export default function UserRolesPage({ params }: UserRolesPageProps) {
    const userId = parseUserId(params.id);

    return (
        <ProtectedRoute requiredEndpoints={USER_ROLES_VIEW_ENDPOINTS}>
            {userId === null ? (
                <div className="card">
                    <EmptyState
                        icon="pi-user-minus"
                        title="Usuario no válido"
                        description="El identificador del usuario en la dirección no es válido."
                        action={<Link href="/usuarios">Volver a usuarios</Link>}
                    />
                </div>
            ) : (
                <UserRolesContent userId={userId} />
            )}
        </ProtectedRoute>
    );
}

function UserRolesContent({ userId }: { userId: number }) {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { user: currentUser, hasPermissionUrl, refreshPermissions } =
        useAuth();
    const {
        user,
        assignedRoles,
        availableRoles,
        effectivePermissions,
        effectiveModules,
        pendingRoleIds,
        initialLoading,
        permissionsLoading,
        loadError,
        permissionsError,
        assign,
        remove,
        reload
    } = useUserRoles(userId);

    const canAssign = hasPermissionUrl(
        USER_ROLE_ASSIGN_ENDPOINT.url,
        USER_ROLE_ASSIGN_ENDPOINT.method
    );
    const canRemove = hasPermissionUrl(
        USER_ROLE_REMOVE_ENDPOINT.url,
        USER_ROLE_REMOVE_ENDPOINT.method
    );
    const isOwnAccount = currentUser?.id === userId;
    const userName = user?.name ?? 'el usuario';

    const notify = (
        result: RoleActionResult,
        successSummary: string,
        successDetail: string,
        errorSummary: string
    ) => {
        if (result.ok) {
            toast.current?.show({
                severity: 'success',
                summary: successSummary,
                detail: successDetail,
                life: 3000
            });

            // Si el administrador cambió sus propios roles, sus permisos en
            // sesión (menú, guardias) deben reflejarlo.
            if (isOwnAccount) {
                void refreshPermissions();
            }
            return;
        }

        toast.current?.show({
            severity: 'error',
            summary: errorSummary,
            detail: result.error,
            life: 5000
        });
    };

    const handleAssign = async (role: RoleSummary) => {
        notify(
            await assign(role),
            'Rol asignado',
            `Se asignó el rol «${role.name}» a ${userName}.`,
            'No se pudo asignar el rol'
        );
    };

    const handleRemove = async (role: RoleSummary) => {
        notify(
            await remove(role),
            'Rol retirado',
            `Se retiró el rol «${role.name}» de ${userName}.`,
            'No se pudo retirar el rol'
        );
    };

    const confirmRemove = (role: RoleSummary) => {
        confirmDialog({
            header: 'Retirar rol',
            icon: 'pi pi-exclamation-triangle',
            message: (
                <div className="flex flex-column gap-2 line-height-3">
                    <span>
                        ¿Deseas retirar el rol <strong>{role.name}</strong> de{' '}
                        <strong>{userName}</strong>?
                    </span>
                    <span className="text-600 text-sm">
                        El usuario y el rol seguirán existiendo en el sistema;
                        solo se elimina la asociación entre ambos.
                    </span>
                    {isOwnAccount && (
                        <span className="text-600 text-sm">
                            Estás modificando tu propia cuenta: podrías perder
                            acceso a esta vista.
                        </span>
                    )}
                </div>
            ),
            acceptLabel: 'Retirar rol',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: () => void handleRemove(role),
            reject: () => undefined
        });
    };

    const pageHeader = (
        <PageHeader
            title="Asignar Roles a Usuario"
            subtitle="Asigna o retira los roles del usuario y revisa los permisos efectivos que obtiene con ellos."
            breadcrumb={[
                { label: 'Usuarios', href: '/usuarios' },
                { label: user?.name ?? 'Usuario' },
                { label: 'Roles' }
            ]}
            actions={
                <Button
                    label="Volver a usuarios"
                    icon="pi pi-arrow-left"
                    text
                    onClick={() => router.push('/usuarios')}
                />
            }
        />
    );

    if (loadError && !user) {
        return (
            <>
                {pageHeader}
                <div className="card flex flex-column gap-3">
                    <Message severity="error" text={loadError} className="w-full" />
                    <div>
                        <Button
                            label="Reintentar"
                            icon="pi pi-refresh"
                            onClick={reload}
                        />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {pageHeader}

            {loadError && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={loadError} className="w-full" />
                    <Button
                        label="Reintentar"
                        icon="pi pi-refresh"
                        outlined
                        onClick={reload}
                    />
                </div>
            )}

            {!initialLoading && !canAssign && !canRemove && (
                <Message
                    severity="info"
                    className="w-full mb-4 justify-content-start"
                    text="Tienes acceso de solo lectura: no puedes asignar ni retirar roles."
                />
            )}

            <div className="grid">
                <div className="col-12 lg:col-4 xl:col-3">
                    <UserSummaryCard
                        name={user?.name}
                        email={user?.email}
                        loading={initialLoading}
                    />
                    <UserRoleStats
                        assignedCount={assignedRoles.length}
                        availableCount={availableRoles.length}
                        effectiveCount={effectivePermissions.length}
                        loading={initialLoading}
                        permissionsLoading={permissionsLoading}
                    />
                    <AccessRulesBox />
                </div>

                <div className="col-12 lg:col-8 xl:col-9">
                    <DualListSelector
                        assigned={assignedRoles}
                        available={availableRoles}
                        getKey={getRoleKey}
                        getSearchText={getRoleSearchText}
                        renderItem={renderRole}
                        labels={ROLE_LIST_LABELS}
                        onAssign={canAssign ? handleAssign : undefined}
                        onRemove={canRemove ? confirmRemove : undefined}
                        getActionAriaLabel={(role, action) =>
                            action === 'assign'
                                ? `Asignar el rol ${role.name} a ${userName}`
                                : `Retirar el rol ${role.name} de ${userName}`
                        }
                        pendingKeys={pendingRoleIds}
                        loading={initialLoading}
                    />

                    <div className="mt-3">
                        <EffectivePermissionsPanel
                            modules={effectiveModules}
                            total={effectivePermissions.length}
                            loading={initialLoading || permissionsLoading}
                            error={permissionsError}
                            onRetry={reload}
                        />
                    </div>
                </div>
            </div>

            <Toast ref={toast} />
            <ConfirmDialog />
        </>
    );
}
