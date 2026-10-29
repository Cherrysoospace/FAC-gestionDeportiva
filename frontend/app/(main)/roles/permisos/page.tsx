'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import LoadingState from '@/components/ui/LoadingState';
import PageHeader from '@/components/ui/PageHeader';
import ProtectedRoute from '@/layout/ProtectedRoute';
import {
    ROLE_PERMISSIONS_VIEW_ENDPOINTS,
    ROLE_PERMISSIONS_VIEW_REQUIREMENT
} from '@/lib/security-constants';
import RoleSelector from './components/RoleSelector';
import PermissionMatrix from './components/PermissionMatrix';
import RoleSummaryPanel from './components/RoleSummaryPanel';
import { useRolePermissions } from './hooks/useRolePermissions';
import styles from './permissions.module.scss';

export default function RolePermissionsPage() {
    return (
        <ProtectedRoute
            requiredPermissions={[ROLE_PERMISSIONS_VIEW_REQUIREMENT]}
            requiredEndpoints={ROLE_PERMISSIONS_VIEW_ENDPOINTS}
        >
            <RolePermissionsContent />
        </ProtectedRoute>
    );
}

function RolePermissionsContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const {
        roles,
        catalog,
        selectedRoleId,
        selectedRole,
        summary,
        selectedIds,
        initialLoading,
        roleLoading,
        saving,
        loadError,
        saveError,
        dirty,
        loading,
        totalAvailable,
        assignedCount,
        notAssigned,
        localModules,
        selectRole,
        reloadRole,
        reloadAll,
        togglePermissions,
        reset,
        save
    } = useRolePermissions();

    useEffect(() => {
        if (!dirty) {
            return;
        }

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [dirty]);

    useEffect(() => {
        if (!dirty) {
            return;
        }

        const handleDocumentClick = (event: MouseEvent) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                !(event.target instanceof Element)
            ) {
                return;
            }

            const anchor = event.target.closest<HTMLAnchorElement>(
                'a[href]'
            );

            if (
                !anchor ||
                anchor.target === '_blank' ||
                anchor.hasAttribute('download')
            ) {
                return;
            }

            const href = anchor.getAttribute('href');

            if (!href || href.startsWith('#')) {
                return;
            }

            let destination: URL;

            try {
                destination = new URL(href, window.location.href);
            } catch {
                return;
            }

            if (
                destination.origin !== window.location.origin ||
                (destination.pathname === window.location.pathname &&
                    destination.search === window.location.search)
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const nextPath =
                destination.pathname + destination.search + destination.hash;

            confirmDialog({
                message:
                    'Tienes cambios sin guardar. Si sales de esta vista, se perderán. ¿Deseas continuar?',
                header: 'Cambios sin guardar',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Salir sin guardar',
                rejectLabel: 'Cancelar',
                accept: () => router.push(nextPath),
                reject: () => undefined
            });
        };

        document.addEventListener('click', handleDocumentClick, true);

        return () =>
            document.removeEventListener('click', handleDocumentClick, true);
    }, [dirty, router]);

    const persist = async () => {
        const success = await save();

        if (success) {
            toast.current?.show({
                severity: 'success',
                summary: 'Permisos actualizados correctamente.',
                detail: 'Los cambios aplican a todos los usuarios con este rol.',
                life: 3000
            });
        }
    };

    const handleSave = () => {
        if (selectedRole && !selectedRole.active) {
            confirmDialog({
                message:
                    'El rol seleccionado está inactivo. Los cambios se guardarán, pero ningún usuario podrá usarlos hasta que el rol se active. ¿Deseas continuar?',
                header: 'Rol inactivo',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Guardar de todos modos',
                rejectLabel: 'Cancelar',
                accept: () => void persist(),
                reject: () => undefined
            });
            return;
        }

        void persist();
    };

    const handleReset = () => {
        confirmDialog({
            message:
                'Se descartarán los cambios no guardados y se restaurará la última configuración guardada. ¿Deseas continuar?',
            header: 'Restablecer cambios',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Restablecer',
            rejectLabel: 'Cancelar',
            accept: reset,
            reject: () => undefined
        });
    };

    const handleBack = () => {
        if (!dirty) {
            router.push('/');
            return;
        }

        confirmDialog({
            message:
                'Tienes cambios sin guardar. Si sales de esta vista, se perderán. ¿Deseas continuar?',
            header: 'Cambios sin guardar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Salir sin guardar',
            rejectLabel: 'Cancelar',
            accept: () => router.push('/'),
            reject: () => undefined
        });
    };

    const handleReload = () => {
        if (!dirty) {
            void reloadRole();
            return;
        }

        confirmDialog({
            message:
                'Se descartarán los cambios no guardados y se recargará la configuración actual del rol. ¿Deseas continuar?',
            header: 'Recargar permisos',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Recargar',
            rejectLabel: 'Cancelar',
            accept: () => void reloadRole(),
            reject: () => undefined
        });
    };

    const handleRoleChange = (roleId: number) => {
        if (roleId === selectedRoleId) {
            return;
        }

        if (!dirty) {
            void selectRole(roleId);
            return;
        }

        confirmDialog({
            message:
                'Tienes cambios sin guardar. Si cambias de rol, se perderán. ¿Deseas continuar?',
            header: 'Cambios sin guardar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Cambiar de rol',
            rejectLabel: 'Cancelar',
            accept: () => void selectRole(roleId),
            reject: () => undefined
        });
    };

    if (initialLoading) {
        return (
            <div className="card">
                <LoadingState message="Cargando roles y permisos…" />
            </div>
        );
    }

    if (loadError && roles.length === 0) {
        return (
            <div className="card flex flex-column gap-3">
                <Message severity="error" text={loadError} className="w-full" />
                <div>
                    <Button
                        label="Reintentar"
                        icon="pi pi-refresh"
                        onClick={() => void reloadAll()}
                    />
                </div>
            </div>
        );
    }

    if (roles.length === 0) {
        return (
            <div className="card flex flex-column gap-3">
                <Message
                    severity="info"
                    className="w-full"
                    text="No hay roles registrados. Crea un rol antes de asignar permisos."
                />
                <div>
                    <Button
                        label="Recargar"
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => void reloadAll()}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Asignar permisos a roles"
                subtitle="Elige un rol y marca las acciones que podrán realizar las personas que lo tengan."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Asignar permisos' }]}
                actions={
                    <Button
                        label="Volver al inicio"
                        icon="pi pi-arrow-left"
                        text
                        onClick={handleBack}
                    />
                }
            />

            {loadError && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message
                        severity="error"
                        text={loadError}
                        className="w-full"
                    />
                    <Button
                        label="Reintentar"
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => void reloadAll()}
                    />
                </div>
            )}

            <div className="card mb-4">
                <div className="flex flex-column xl:flex-row xl:align-items-end gap-3">
                    <div className="flex-1">
                        <RoleSelector
                            roles={roles}
                            value={selectedRoleId}
                            loading={roleLoading}
                            disabled={saving}
                            onChange={handleRoleChange}
                        />
                    </div>
                    <div className="flex align-items-center gap-2 flex-wrap">
                        {selectedRole && (
                            <Tag
                                value={
                                    selectedRole.active
                                        ? 'Activo'
                                        : 'Inactivo'
                                }
                                severity={
                                    selectedRole.active ? 'success' : 'danger'
                                }
                            />
                        )}
                        {dirty ? (
                            <Tag
                                value="Cambios sin guardar"
                                severity="warning"
                            />
                        ) : (
                            <Tag
                                value="Sin cambios pendientes"
                                severity="success"
                            />
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            label="Cargar permisos"
                            icon="pi pi-refresh"
                            outlined
                            loading={roleLoading}
                            disabled={saving || selectedRoleId === null}
                            onClick={handleReload}
                        />
                        <Button
                            label="Restablecer"
                            icon="pi pi-undo"
                            outlined
                            disabled={
                                !dirty || saving || selectedRoleId === null
                            }
                            onClick={handleReset}
                        />
                        <Button
                            label="Guardar cambios"
                            icon="pi pi-check"
                            loading={saving}
                            disabled={
                                !dirty || selectedRoleId === null || loading
                            }
                            onClick={handleSave}
                        />
                    </div>
                </div>

                <Message
                    severity="info"
                    className="w-full mt-3"
                    text="Los permisos seleccionados se conservarán después de cerrar e iniciar sesión nuevamente."
                />

                {saveError && (
                    <Message
                        severity="error"
                        text={saveError}
                        className="w-full mt-3"
                    />
                )}
            </div>

            <div className="grid">
                <div className="col-12 lg:col-8">
                    <div
                        className={classNames(styles.matrixArea, {
                            [styles.matrixAreaBusy]: roleLoading
                        })}
                        aria-busy={roleLoading}
                    >
                        <PermissionMatrix
                            catalog={catalog}
                            selectedIds={selectedIds}
                            disabled={roleLoading || saving}
                            onToggle={togglePermissions}
                        />
                    </div>
                </div>

                <div className="col-12 lg:col-4">
                    <RoleSummaryPanel
                        role={selectedRole}
                        summary={summary}
                        assignedCount={assignedCount}
                        totalAvailable={totalAvailable}
                        notAssigned={notAssigned}
                        modules={localModules}
                        dirty={dirty}
                        loading={roleLoading}
                        saving={saving}
                        onSave={handleSave}
                    />
                </div>
            </div>

            <Toast ref={toast} />
            <ConfirmDialog />
        </>
    );
}
