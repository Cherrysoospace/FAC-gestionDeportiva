'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { describeError } from '@/lib/api-errors';
import {
    createRole,
    deleteRole,
    fetchRoles,
    fetchRoleSummary,
    updateRole
} from '@/lib/security-api';
import {
    ROLE_CREATE_ENDPOINT,
    ROLE_DELETE_ENDPOINT,
    ROLE_PERMISSIONS_VIEW_ENDPOINTS,
    ROLE_UPDATE_ENDPOINT,
    ROLES_VIEW_ENDPOINTS
} from '@/lib/security-constants';
import {
    EndpointRequirement,
    RoleAccessSummary,
    RoleFormValues,
    RoleSummary
} from '@/types/security';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
    { label: 'Todos los estados', value: 'ALL' },
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' }
];

const ROLE_STATUS_OPTIONS = [
    { label: '● Activo', value: true },
    { label: '● Inactivo', value: false }
];

const SKELETON_ROWS: RoleSummary[] = Array.from({ length: 4 }, (_, index) => ({
    id: -(index + 1),
    name: '',
    description: '',
    active: true
}));

export default function RolesPage() {
    return (
        <ProtectedRoute requiredEndpoints={ROLES_VIEW_ENDPOINTS}>
            <RolesContent />
        </ProtectedRoute>
    );
}

function RolesContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl, refreshPermissions } = useAuth();

    const [roles, setRoles] = useState<RoleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

    const [selectedRole, setSelectedRole] = useState<RoleSummary | null>(null);
    const [selectedSummary, setSelectedSummary] =
        useState<RoleAccessSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [deleteBlockWarning, setDeleteBlockWarning] = useState<string | null>(
        null
    );

    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleSummary | null>(null);
    const [formValues, setFormValues] = useState<RoleFormValues>({
        name: '',
        description: '',
        active: true
    });
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSaving, setFormSaving] = useState(false);

    const can = (...endpoints: EndpointRequirement[]) =>
        endpoints.every((endpoint) =>
            hasPermissionUrl(endpoint.url, endpoint.method)
        );
    const canCreate = can(ROLE_CREATE_ENDPOINT);
    const canUpdate = can(ROLE_UPDATE_ENDPOINT);
    const canDelete = can(ROLE_DELETE_ENDPOINT);
    const canManagePermissions = can(...ROLE_PERMISSIONS_VIEW_ENDPOINTS);

    const loadRoleDetail = useCallback(async (role: RoleSummary) => {
        setSelectedRole(role);
        setSummaryLoading(true);
        try {
            const summary = await fetchRoleSummary(role.id);
            setSelectedSummary(summary);
        } catch {
            setSelectedSummary(null);
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    const loadRoles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchRoles();
            setRoles(data);
            if (data.length > 0) {
                const current =
                    (selectedRole &&
                        data.find((item) => item.id === selectedRole.id)) ??
                    data[0];
                void loadRoleDetail(current);
            } else {
                setSelectedRole(null);
                setSelectedSummary(null);
            }
        } catch (cause) {
            setError(describeError(cause));
        } finally {
            setLoading(false);
        }
    }, [loadRoleDetail, selectedRole]);

    useEffect(() => {
        void loadRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredRoles = useMemo(() => {
        const term = query.trim().toLowerCase();
        return roles.filter((role) => {
            if (statusFilter === 'ACTIVE' && !role.active) return false;
            if (statusFilter === 'INACTIVE' && role.active) return false;
            if (!term) return true;
            return (
                role.name.toLowerCase().includes(term) ||
                (role.description ?? '').toLowerCase().includes(term)
            );
        });
    }, [roles, query, statusFilter]);

    const openCreateDialog = () => {
        setEditingRole(null);
        setFormValues({ name: '', description: '', active: true });
        setFormSubmitted(false);
        setFormError(null);
        setDialogVisible(true);
    };

    const openEditDialog = (role: RoleSummary) => {
        setEditingRole(role);
        setFormValues({
            name: role.name,
            description: role.description ?? '',
            active: role.active
        });
        setFormSubmitted(false);
        setFormError(null);
        setDialogVisible(true);
    };

    const handleFormSave = async (event: React.FormEvent) => {
        event.preventDefault();
        setFormSubmitted(true);
        setFormError(null);

        const trimmedName = formValues.name.trim();
        const trimmedDescription = formValues.description.trim();

        if (!trimmedName || !trimmedDescription) {
            return;
        }

        setFormSaving(true);
        try {
            const payload: RoleFormValues = {
                name: trimmedName,
                description: trimmedDescription,
                active: formValues.active
            };

            const saved = editingRole
                ? await updateRole(editingRole.id, payload)
                : await createRole(payload);

            setDialogVisible(false);
            toast.current?.show({
                severity: 'success',
                summary: editingRole ? 'Rol actualizado' : 'Rol creado',
                detail: editingRole
                    ? `Se actualizó el rol «${saved.name}».`
                    : `Se registró el rol «${saved.name}».`,
                life: 3000
            });

            await loadRoles();
            void loadRoleDetail(saved);
            void refreshPermissions();
        } catch (cause) {
            setFormError(describeError(cause));
        } finally {
            setFormSaving(false);
        }
    };

    const handleDeleteRole = (role: RoleSummary) => {
        setDeleteBlockWarning(null);
        confirmDialog({
            header: 'Eliminar rol',
            icon: 'pi pi-exclamation-triangle',
            message: (
                <div className="flex flex-column gap-2 line-height-3">
                    <span>
                        ¿Deseas eliminar el rol <strong>{role.name}</strong>?
                    </span>
                    <span className="text-600 text-sm">
                        Eliminar un rol no elimina los usuarios ni los permisos
                        existentes en la plataforma. Si el rol tiene usuarios
                        asociados, no podrá eliminarse.
                    </span>
                </div>
            ),
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await deleteRole(role.id);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Rol eliminado',
                        detail: `El rol «${role.name}» fue eliminado correctamente.`,
                        life: 3000
                    });
                    await loadRoles();
                } catch (cause) {
                    const message = describeError(cause);
                    setDeleteBlockWarning(
                        `No se puede eliminar '${role.name}' porque tiene usuarios asociados o restricciones activas.`
                    );
                    toast.current?.show({
                        severity: 'error',
                        summary: 'No se puede eliminar el rol',
                        detail: message,
                        life: 5000
                    });
                }
            }
        });
    };

    const roleNameBody = (role: RoleSummary) =>
        loading ? (
            <div className="flex align-items-center gap-2">
                <Skeleton shape="circle" size="2rem" />
                <Skeleton width="8rem" />
            </div>
        ) : (
            <div className="flex align-items-center gap-2">
                <span className="inline-flex align-items-center justify-content-center border-circle surface-hover w-2rem h-2rem">
                    <i
                        className="pi pi-shield text-primary"
                        aria-hidden="true"
                    />
                </span>
                <span className="font-semibold text-900">{role.name}</span>
            </div>
        );

    const descriptionBody = (role: RoleSummary) =>
        loading ? (
            <Skeleton width="14rem" />
        ) : (
            <span className="text-700">{role.description || '—'}</span>
        );

    const statusBody = (role: RoleSummary) =>
        loading ? (
            <Skeleton width="4rem" />
        ) : (
            <Tag
                value={role.active ? '● Activo' : '● Inactivo'}
                severity={role.active ? 'success' : 'danger'}
            />
        );

    const actionsBody = (role: RoleSummary) => {
        if (loading) return <Skeleton width="10rem" height="2rem" />;

        return (
            <div className="flex gap-1">
                <Button
                    icon="pi pi-eye"
                    rounded
                    text
                    tooltip="Ver detalle del rol"
                    tooltipOptions={{ position: 'top' }}
                    aria-label={`Ver detalle de ${role.name}`}
                    onClick={() => void loadRoleDetail(role)}
                />
                {canUpdate && (
                    <Button
                        icon="pi pi-pencil"
                        rounded
                        text
                        tooltip="Editar rol"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Editar rol ${role.name}`}
                        onClick={() => openEditDialog(role)}
                    />
                )}
                <Button
                    icon="pi pi-users"
                    rounded
                    text
                    tooltip="Usuarios del rol (HU-SE-04)"
                    tooltipOptions={{ position: 'top' }}
                    aria-label={`Gestionar usuarios del rol ${role.name}`}
                    onClick={() => router.push(`/roles/${role.id}/usuarios`)}
                />
                {canManagePermissions && (
                    <Button
                        icon="pi pi-key"
                        rounded
                        text
                        tooltip="Asignar permisos (HU-SE-06)"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Asignar permisos al rol ${role.name}`}
                        onClick={() =>
                            router.push(`/roles/permisos?roleId=${role.id}`)
                        }
                    />
                )}
                {canDelete && (
                    <Button
                        icon="pi pi-trash"
                        rounded
                        text
                        severity="danger"
                        tooltip="Eliminar rol"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Eliminar rol ${role.name}`}
                        onClick={() => handleDeleteRole(role)}
                    />
                )}
            </div>
        );
    };

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />

            <PageHeader
                title="Gestión de Roles"
                subtitle="Administra los roles registrados en la plataforma y accede a sus usuarios y permisos."
                breadcrumb={[
                    { label: 'Inicio', href: '/' },
                    { label: 'Roles' }
                ]}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {canManagePermissions && (
                            <Button
                                label="Matriz de permisos"
                                icon="pi pi-lock"
                                outlined
                                onClick={() => router.push('/roles/permisos')}
                            />
                        )}
                        {canCreate && (
                            <Button
                                label="Nuevo rol"
                                icon="pi pi-plus"
                                onClick={openCreateDialog}
                            />
                        )}
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
                        onClick={() => void loadRoles()}
                    />
                </div>
            )}

            <div className="card mb-4">
                <div className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-3">
                    <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 flex-1">
                        <SearchInput
                            value={query}
                            onChange={setQuery}
                            ariaLabel="Buscar rol por nombre o descripción"
                            placeholder="Buscar rol..."
                            disabled={loading}
                        />
                        <Dropdown
                            value={statusFilter}
                            options={STATUS_FILTER_OPTIONS}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(event) => setStatusFilter(event.value)}
                            className="w-full sm:w-14rem"
                            aria-label="Filtrar roles por estado"
                        />
                    </div>
                    {canCreate && (
                        <Button
                            label="Nuevo rol"
                            icon="pi pi-plus"
                            onClick={openCreateDialog}
                        />
                    )}
                </div>
            </div>

            <div className="grid">
                <div className="col-12 lg:col-8">
                    <div className="card">
                        <div className="flex align-items-center justify-content-between gap-2 mb-3">
                            <div className="flex align-items-center gap-2">
                                <i
                                    className="pi pi-list text-primary"
                                    aria-hidden="true"
                                />
                                <h5 className="m-0">Lista de roles</h5>
                                {!loading && (
                                    <Tag
                                        value={`${filteredRoles.length} roles`}
                                        severity="info"
                                    />
                                )}
                            </div>
                        </div>

                        <DataTable
                            value={loading ? SKELETON_ROWS : filteredRoles}
                            dataKey="id"
                            selectionMode="single"
                            selection={selectedRole ?? undefined}
                            onSelectionChange={(event) => {
                                const value = event.value as
                                    | RoleSummary
                                    | undefined;
                                if (value && value.id > 0) {
                                    void loadRoleDetail(value);
                                }
                            }}
                            paginator={!loading && filteredRoles.length > 8}
                            rows={8}
                            emptyMessage={
                                <EmptyState
                                    icon="pi-shield"
                                    title={
                                        query || statusFilter !== 'ALL'
                                            ? 'Ningún rol coincide con el filtro.'
                                            : 'No hay roles registrados.'
                                    }
                                />
                            }
                        >
                            <Column header="Rol" body={roleNameBody} />
                            <Column
                                header="Descripción"
                                body={descriptionBody}
                            />
                            <Column header="Estado" body={statusBody} />
                            <Column
                                header="Acciones"
                                body={actionsBody}
                                headerClassName="w-14rem"
                            />
                        </DataTable>
                    </div>
                </div>

                <div className="col-12 lg:col-4">
                    <div className="card">
                        <div className="flex align-items-center justify-content-between gap-2 mb-3">
                            <div className="flex align-items-center gap-2">
                                <i
                                    className="pi pi-info-circle text-primary"
                                    aria-hidden="true"
                                />
                                <h5 className="m-0">Detalle del rol</h5>
                            </div>
                            {selectedRole && (
                                <Tag
                                    value={`ID: ROL-${String(
                                        selectedRole.id
                                    ).padStart(3, '0')}`}
                                    className="surface-ground text-700"
                                />
                            )}
                        </div>

                        {selectedRole ? (
                            <div className="flex flex-column gap-3">
                                <div className="flex align-items-center gap-3 p-3 border-round surface-ground border-1 surface-border">
                                    <span className="inline-flex align-items-center justify-content-center border-circle bg-primary w-3rem h-3rem flex-shrink-0">
                                        <i
                                            className="pi pi-shield text-xl"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <div className="flex flex-column gap-1">
                                        <div className="flex align-items-center gap-2 flex-wrap">
                                            <span className="text-xl font-bold text-900">
                                                {selectedRole.name}
                                            </span>
                                            <Tag
                                                value={
                                                    selectedRole.active
                                                        ? '● Activo'
                                                        : '● Inactivo'
                                                }
                                                severity={
                                                    selectedRole.active
                                                        ? 'success'
                                                        : 'danger'
                                                }
                                            />
                                        </div>
                                        <span className="text-600 text-sm">
                                            Nivel de acceso del sistema
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-column gap-2 py-2 border-bottom-1 surface-border">
                                    <div className="flex justify-content-between text-sm">
                                        <span className="text-600">Nombre</span>
                                        <span className="text-900 font-medium">
                                            {selectedRole.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-content-between text-sm">
                                        <span className="text-600">Estado</span>
                                        <span className="text-900 font-medium">
                                            {selectedRole.active
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </span>
                                    </div>
                                    <div className="flex flex-column gap-1 text-sm">
                                        <span className="text-600">
                                            Descripción
                                        </span>
                                        <span className="text-900 line-height-3">
                                            {selectedRole.description ||
                                                'Sin descripción'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid">
                                    <div className="col-6">
                                        <div className="p-3 border-round surface-ground border-1 surface-border flex align-items-center gap-3">
                                            <i
                                                className="pi pi-users text-primary text-2xl"
                                                aria-hidden="true"
                                            />
                                            <div className="flex flex-column">
                                                <span className="text-2xl font-bold text-900">
                                                    {summaryLoading
                                                        ? '…'
                                                        : (selectedSummary?.usersCount ??
                                                          0)}
                                                </span>
                                                <span className="text-600 text-xs">
                                                    usuarios asociados
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="p-3 border-round surface-ground border-1 surface-border flex align-items-center gap-3">
                                            <i
                                                className="pi pi-key text-green-500 text-2xl"
                                                aria-hidden="true"
                                            />
                                            <div className="flex flex-column">
                                                <span className="text-2xl font-bold text-900">
                                                    {summaryLoading
                                                        ? '…'
                                                        : (selectedSummary?.assignedCount ??
                                                          0)}
                                                </span>
                                                <span className="text-600 text-xs">
                                                    permisos asignados
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-column gap-2">
                                    <span className="text-900 font-semibold text-sm">
                                        Módulos asociados
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSummary &&
                                        selectedSummary.modulesWithAccess
                                            .length > 0 ? (
                                            selectedSummary.modulesWithAccess.map(
                                                (moduleName) => (
                                                    <Tag
                                                        key={moduleName}
                                                        value={`● ${moduleName}`}
                                                        severity="info"
                                                    />
                                                )
                                            )
                                        ) : (
                                            <span className="text-600 text-sm">
                                                Sin módulos asignados
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button
                                        label="Usuarios del rol"
                                        icon="pi pi-users"
                                        outlined
                                        size="small"
                                        className="flex-1"
                                        onClick={() =>
                                            router.push(
                                                `/roles/${selectedRole.id}/usuarios`
                                            )
                                        }
                                    />
                                    {canManagePermissions && (
                                        <Button
                                            label="Permisos"
                                            icon="pi pi-key"
                                            outlined
                                            size="small"
                                            className="flex-1"
                                            onClick={() =>
                                                router.push(
                                                    `/roles/permisos?roleId=${selectedRole.id}`
                                                )
                                            }
                                        />
                                    )}
                                    {canUpdate && (
                                        <Button
                                            label="Editar"
                                            icon="pi pi-pencil"
                                            outlined
                                            size="small"
                                            onClick={() =>
                                                openEditDialog(selectedRole)
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                icon="pi-shield"
                                title="Selecciona un rol"
                                description="Haz clic en un rol de la tabla para consultar su detalle, usuarios y permisos."
                            />
                        )}
                    </div>

                    {deleteBlockWarning && (
                        <div className="card mt-3 border-1 border-red-500">
                            <div className="flex align-items-start justify-content-between gap-2">
                                <div className="flex align-items-start gap-2">
                                    <i
                                        className="pi pi-exclamation-triangle text-red-500 text-xl mt-1"
                                        aria-hidden="true"
                                    />
                                    <div className="flex flex-column gap-1">
                                        <span className="font-semibold text-900 text-sm">
                                            No se puede eliminar el rol
                                        </span>
                                        <span className="text-600 text-sm">
                                            {deleteBlockWarning}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    icon="pi pi-times"
                                    text
                                    rounded
                                    size="small"
                                    aria-label="Cerrar alerta"
                                    onClick={() => setDeleteBlockWarning(null)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                header={editingRole ? 'Editar rol' : 'Registrar rol'}
                visible={dialogVisible}
                style={{ width: 'min(92vw, 32rem)' }}
                modal
                onHide={() => !formSaving && setDialogVisible(false)}
            >
                <form
                    onSubmit={(event) => void handleFormSave(event)}
                    className="flex flex-column gap-3 pt-2"
                >
                    {formError && (
                        <Message
                            severity="error"
                            text={formError}
                            className="w-full"
                        />
                    )}

                    <div className="grid">
                        <div className="col-12 sm:col-7 flex flex-column gap-2">
                            <label
                                htmlFor="role-name"
                                className="text-900 font-medium text-sm"
                            >
                                Nombre del rol{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="role-name"
                                value={formValues.name}
                                maxLength={50}
                                placeholder="Ej. Coordinador"
                                className={
                                    formSubmitted && !formValues.name.trim()
                                        ? 'p-invalid w-full'
                                        : 'w-full'
                                }
                                onChange={(event) =>
                                    setFormValues((prev) => ({
                                        ...prev,
                                        name: event.target.value
                                    }))
                                }
                            />
                            {formSubmitted && !formValues.name.trim() && (
                                <small className="p-error">
                                    Este campo es obligatorio
                                </small>
                            )}
                        </div>

                        <div className="col-12 sm:col-5 flex flex-column gap-2">
                            <label
                                htmlFor="role-active"
                                className="text-900 font-medium text-sm"
                            >
                                Estado <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                inputId="role-active"
                                value={formValues.active}
                                options={ROLE_STATUS_OPTIONS}
                                optionLabel="label"
                                optionValue="value"
                                className="w-full"
                                onChange={(event) =>
                                    setFormValues((prev) => ({
                                        ...prev,
                                        active: Boolean(event.value)
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="flex flex-column gap-2">
                        <label
                            htmlFor="role-description"
                            className="text-900 font-medium text-sm"
                        >
                            Descripción <span className="text-red-500">*</span>
                        </label>
                        <InputTextarea
                            id="role-description"
                            value={formValues.description}
                            rows={3}
                            maxLength={255}
                            placeholder="Describe las responsabilidades del rol..."
                            className={
                                formSubmitted && !formValues.description.trim()
                                    ? 'p-invalid w-full'
                                    : 'w-full'
                            }
                            onChange={(event) =>
                                setFormValues((prev) => ({
                                    ...prev,
                                    description: event.target.value
                                }))
                            }
                        />
                        <div className="flex justify-content-between">
                            {formSubmitted &&
                            !formValues.description.trim() ? (
                                <small className="p-error">
                                    Este campo es obligatorio
                                </small>
                            ) : (
                                <span />
                            )}
                            <small className="text-500">
                                {formValues.description.length}/255
                            </small>
                        </div>
                    </div>

                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button
                            type="button"
                            label="Cancelar"
                            outlined
                            disabled={formSaving}
                            onClick={() => setDialogVisible(false)}
                        />
                        <Button
                            type="submit"
                            label="Guardar"
                            icon="pi pi-save"
                            loading={formSaving}
                        />
                    </div>
                </form>
            </Dialog>
        </>
    );
}

