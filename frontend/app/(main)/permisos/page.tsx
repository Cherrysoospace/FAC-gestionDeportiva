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
    createPermission,
    deletePermission,
    fetchPermissionCatalog,
    fetchPermissionRoles,
    updatePermission
} from '@/lib/security-api';
import {
    PERMISSION_CREATE_ENDPOINT,
    PERMISSION_DELETE_ENDPOINT,
    PERMISSION_UPDATE_ENDPOINT,
    PERMISSIONS_VIEW_ENDPOINTS,
    ROLE_PERMISSIONS_VIEW_ENDPOINTS
} from '@/lib/security-constants';
import {
    EndpointRequirement,
    PermissionFormValues,
    PermissionItem,
    PermissionOperation,
    PermissionRoleAssignment
} from '@/types/security';

const HTTP_METHODS = [
    { label: 'GET (Listar / Ver)', value: 'GET' },
    { label: 'POST (Crear)', value: 'POST' },
    { label: 'PUT (Actualizar)', value: 'PUT' },
    { label: 'PATCH (Actualizar parcial)', value: 'PATCH' },
    { label: 'DELETE (Eliminar)', value: 'DELETE' }
];

const QUICK_RESOURCES = [
    { label: 'Usuarios (/api/users)', base: '/api/users' },
    { label: 'Roles (/api/roles)', base: '/api/roles' },
    { label: 'Permisos (/api/permissions)', base: '/api/permissions' },
    { label: 'Torneos (/api/torneos)', base: '/api/torneos' },
    { label: 'Equipos (/api/equipos)', base: '/api/equipos' },
    { label: 'Jugadores (/api/jugadores)', base: '/api/jugadores' },
    { label: 'Partidos (/api/partidos)', base: '/api/partidos' },
    { label: 'Entradas (/api/entradas)', base: '/api/entradas' },
    { label: 'Escenarios (/api/escenarios)', base: '/api/escenarios' },
    { label: 'Reportes (/api/reportes)', base: '/api/reportes' }
];

const QUICK_OPERATIONS: Array<{
    label: string;
    value: PermissionOperation;
    method: string;
    withId: boolean;
}> = [
    { label: 'Listar (GET colección)', value: 'LISTAR', method: 'GET', withId: false },
    { label: 'Ver detalle (GET /{id})', value: 'VER', method: 'GET', withId: true },
    { label: 'Crear (POST)', value: 'CREAR', method: 'POST', withId: false },
    { label: 'Actualizar (PUT /{id})', value: 'ACTUALIZAR', method: 'PUT', withId: true },
    { label: 'Eliminar (DELETE /{id})', value: 'ELIMINAR', method: 'DELETE', withId: true }
];

const OPERATION_FILTER_OPTIONS = [
    { label: 'Todas las operaciones', value: 'ALL' },
    { label: 'Ver', value: 'VER' },
    { label: 'Listar', value: 'LISTAR' },
    { label: 'Crear', value: 'CREAR' },
    { label: 'Actualizar', value: 'ACTUALIZAR' },
    { label: 'Eliminar', value: 'ELIMINAR' }
];

const SKELETON_ROWS: PermissionItem[] = Array.from(
    { length: 5 },
    (_, index) => ({
        id: -(index + 1),
        url: '',
        method: 'GET',
        module: '',
        resource: '',
        operation: 'LISTAR',
        operationLabel: ''
    })
);

function methodSeverity(
    method: string
): 'success' | 'info' | 'warning' | 'danger' {
    switch (method.toUpperCase()) {
        case 'GET':
            return 'info';
        case 'POST':
            return 'success';
        case 'PUT':
        case 'PATCH':
            return 'warning';
        case 'DELETE':
            return 'danger';
        default:
            return 'info';
    }
}

export default function PermissionsPage() {
    return (
        <ProtectedRoute requiredEndpoints={PERMISSIONS_VIEW_ENDPOINTS}>
            <PermissionsContent />
        </ProtectedRoute>
    );
}

function PermissionsContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl, refreshPermissions } = useAuth();

    const [permissions, setPermissions] = useState<PermissionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [moduleFilter, setModuleFilter] = useState<string>('ALL');
    const [operationFilter, setOperationFilter] = useState<string>('ALL');

    const [selectedPermission, setSelectedPermission] =
        useState<PermissionItem | null>(null);
    const [assignedRoles, setAssignedRoles] = useState<
        PermissionRoleAssignment[]
    >([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [deleteBlockWarning, setDeleteBlockWarning] = useState<string | null>(
        null
    );

    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingPermission, setEditingPermission] =
        useState<PermissionItem | null>(null);
    const [quickResourceBase, setQuickResourceBase] = useState<string>('');
    const [quickOperation, setQuickOperation] =
        useState<PermissionOperation | null>(null);
    const [formValues, setFormValues] = useState<PermissionFormValues>({
        method: 'GET',
        url: '/api/'
    });
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSaving, setFormSaving] = useState(false);

    const can = (...endpoints: EndpointRequirement[]) =>
        endpoints.every((endpoint) =>
            hasPermissionUrl(endpoint.url, endpoint.method)
        );
    const canCreate = can(PERMISSION_CREATE_ENDPOINT);
    const canUpdate = can(PERMISSION_UPDATE_ENDPOINT);
    const canDelete = can(PERMISSION_DELETE_ENDPOINT);
    const canManageMatrix = can(...ROLE_PERMISSIONS_VIEW_ENDPOINTS);

    const selectPermissionDetail = useCallback(async (item: PermissionItem) => {
        setSelectedPermission(item);
        setRolesLoading(true);
        try {
            const rolesData = await fetchPermissionRoles(item.id);
            setAssignedRoles(rolesData);
        } catch {
            setAssignedRoles([]);
        } finally {
            setRolesLoading(false);
        }
    }, []);

    const loadPermissions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const catalog = await fetchPermissionCatalog();
            const items = catalog.modules.flatMap((moduleItem) =>
                moduleItem.resources.flatMap((resource) => resource.permissions)
            );
            setPermissions(items);

            if (items.length > 0) {
                const current =
                    (selectedPermission &&
                        items.find((p) => p.id === selectedPermission.id)) ??
                    items[0];
                void selectPermissionDetail(current);
            } else {
                setSelectedPermission(null);
                setAssignedRoles([]);
            }
        } catch (cause) {
            setError(describeError(cause));
        } finally {
            setLoading(false);
        }
    }, [selectPermissionDetail, selectedPermission]);

    useEffect(() => {
        void loadPermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const moduleOptions = useMemo(() => {
        const uniqueModules = Array.from(
            new Set(permissions.map((item) => item.module))
        );
        return [
            { label: 'Todos los módulos', value: 'ALL' },
            ...uniqueModules.map((moduleName) => ({
                label: moduleName,
                value: moduleName
            }))
        ];
    }, [permissions]);

    const filteredPermissions = useMemo(() => {
        const term = query.trim().toLowerCase();
        return permissions.filter((item) => {
            if (moduleFilter !== 'ALL' && item.module !== moduleFilter) {
                return false;
            }
            if (
                operationFilter !== 'ALL' &&
                item.operation !== operationFilter
            ) {
                return false;
            }
            if (!term) return true;
            return (
                item.resource.toLowerCase().includes(term) ||
                item.module.toLowerCase().includes(term) ||
                item.url.toLowerCase().includes(term) ||
                item.method.toLowerCase().includes(term) ||
                item.operationLabel.toLowerCase().includes(term)
            );
        });
    }, [permissions, query, moduleFilter, operationFilter]);

    const openCreateDialog = () => {
        setEditingPermission(null);
        setQuickResourceBase('/api/torneos');
        setQuickOperation('LISTAR');
        setFormValues({ method: 'GET', url: '/api/torneos' });
        setFormSubmitted(false);
        setFormError(null);
        setDialogVisible(true);
    };

    const openEditDialog = (item: PermissionItem) => {
        setEditingPermission(item);
        setQuickResourceBase('');
        setQuickOperation(item.operation);
        setFormValues({ method: item.method, url: item.url });
        setFormSubmitted(false);
        setFormError(null);
        setDialogVisible(true);
    };

    const applyQuickSelection = (
        base: string,
        operation: PermissionOperation | null
    ) => {
        if (!base || !operation) return;
        const opDescriptor = QUICK_OPERATIONS.find(
            (op) => op.value === operation
        );
        if (!opDescriptor) return;
        setFormValues({
            method: opDescriptor.method,
            url: opDescriptor.withId ? `${base}/{id}` : base
        });
    };

    const handleFormSave = async (event: React.FormEvent) => {
        event.preventDefault();
        setFormSubmitted(true);
        setFormError(null);

        const trimmedUrl = formValues.url.trim();
        const trimmedMethod = formValues.method.trim().toUpperCase();

        if (!trimmedUrl || !trimmedUrl.startsWith('/') || !trimmedMethod) {
            return;
        }

        setFormSaving(true);
        try {
            const payload: PermissionFormValues = {
                url: trimmedUrl,
                method: trimmedMethod
            };

            if (editingPermission) {
                await updatePermission(editingPermission.id, payload);
            } else {
                await createPermission(payload);
            }

            setDialogVisible(false);
            toast.current?.show({
                severity: 'success',
                summary: editingPermission
                    ? 'Permiso actualizado'
                    : 'Permiso registrado',
                detail: `${trimmedMethod} ${trimmedUrl}`,
                life: 3000
            });

            await loadPermissions();
            void refreshPermissions();
        } catch (cause) {
            setFormError(describeError(cause));
        } finally {
            setFormSaving(false);
        }
    };

    const handleDeletePermission = (item: PermissionItem) => {
        setDeleteBlockWarning(null);
        confirmDialog({
            header: 'Eliminar permiso',
            icon: 'pi pi-exclamation-triangle',
            message: (
                <div className="flex flex-column gap-2 line-height-3">
                    <span>
                        ¿Deseas eliminar el permiso{' '}
                        <strong>
                            {item.operationLabel} {item.resource}
                        </strong>{' '}
                        (<code>{item.method} {item.url}</code>)?
                    </span>
                    <span className="text-600 text-sm">
                        La eliminación de un permiso no elimina los roles del
                        sistema. Si el permiso está asignado a algún rol, no
                        podrá eliminarse.
                    </span>
                </div>
            ),
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await deletePermission(item.id);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Permiso eliminado',
                        detail: `Se eliminó ${item.method} ${item.url}.`,
                        life: 3000
                    });
                    await loadPermissions();
                } catch (cause) {
                    const message = describeError(cause);
                    setDeleteBlockWarning(
                        `No se puede eliminar '${item.operationLabel} ${item.resource}' porque está asignado a uno o más roles.`
                    );
                    toast.current?.show({
                        severity: 'error',
                        summary: 'No se puede eliminar el permiso',
                        detail: message,
                        life: 5000
                    });
                }
            }
        });
    };

    const resourceBody = (item: PermissionItem) =>
        loading ? (
            <Skeleton width="9rem" />
        ) : (
            <div className="flex flex-column">
                <span className="font-semibold text-900">{item.resource}</span>
                <span className="text-600 text-xs">{item.module}</span>
            </div>
        );

    const operationBody = (item: PermissionItem) =>
        loading ? (
            <Skeleton width="5rem" />
        ) : (
            <Tag value={item.operationLabel} severity="info" />
        );

    const endpointBody = (item: PermissionItem) =>
        loading ? (
            <Skeleton width="14rem" />
        ) : (
            <div className="flex align-items-center gap-2">
                <Tag
                    value={item.method}
                    severity={methodSeverity(item.method)}
                />
                <code className="text-sm text-800">{item.url}</code>
            </div>
        );

    const actionsBody = (item: PermissionItem) => {
        if (loading) return <Skeleton width="8rem" height="2rem" />;

        return (
            <div className="flex gap-1">
                <Button
                    icon="pi pi-eye"
                    rounded
                    text
                    tooltip="Ver detalle del permiso"
                    tooltipOptions={{ position: 'top' }}
                    aria-label={`Ver detalle de ${item.method} ${item.url}`}
                    onClick={() => void selectPermissionDetail(item)}
                />
                {canUpdate && (
                    <Button
                        icon="pi pi-pencil"
                        rounded
                        text
                        tooltip="Editar permiso"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Editar permiso ${item.method} ${item.url}`}
                        onClick={() => openEditDialog(item)}
                    />
                )}
                {canDelete && (
                    <Button
                        icon="pi pi-trash"
                        rounded
                        text
                        severity="danger"
                        tooltip="Eliminar permiso"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Eliminar permiso ${item.method} ${item.url}`}
                        onClick={() => handleDeletePermission(item)}
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
                title="Gestión de Permisos"
                subtitle="Administra el catálogo de operaciones, recursos, métodos HTTP y endpoints disponibles para los roles."
                breadcrumb={[
                    { label: 'Inicio', href: '/' },
                    { label: 'Permisos' }
                ]}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {canManageMatrix && (
                            <Button
                                label="Asignar en matriz"
                                icon="pi pi-lock"
                                outlined
                                onClick={() => router.push('/roles/permisos')}
                            />
                        )}
                        {canCreate && (
                            <Button
                                label="Nuevo permiso"
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
                        onClick={() => void loadPermissions()}
                    />
                </div>
            )}

            <div className="card mb-4">
                <div className="flex flex-column xl:flex-row xl:align-items-center justify-content-between gap-3">
                    <div className="flex flex-column md:flex-row md:align-items-center gap-3 flex-1">
                        <SearchInput
                            value={query}
                            onChange={setQuery}
                            ariaLabel="Buscar permiso"
                            placeholder="Buscar recurso, módulo o URL..."
                            disabled={loading}
                        />
                        <Dropdown
                            value={moduleFilter}
                            options={moduleOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(event) => setModuleFilter(event.value)}
                            className="w-full md:w-14rem"
                            aria-label="Filtrar por módulo"
                        />
                        <Dropdown
                            value={operationFilter}
                            options={OPERATION_FILTER_OPTIONS}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(event) =>
                                setOperationFilter(event.value)
                            }
                            className="w-full md:w-14rem"
                            aria-label="Filtrar por operación"
                        />
                    </div>
                    {canCreate && (
                        <Button
                            label="Nuevo permiso"
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
                                    className="pi pi-key text-primary"
                                    aria-hidden="true"
                                />
                                <h5 className="m-0">Catálogo de permisos</h5>
                                {!loading && (
                                    <Tag
                                        value={`${filteredPermissions.length} permisos`}
                                        severity="info"
                                    />
                                )}
                            </div>
                        </div>

                        <DataTable
                            value={loading ? SKELETON_ROWS : filteredPermissions}
                            dataKey="id"
                            selectionMode="single"
                            selection={selectedPermission ?? undefined}
                            onSelectionChange={(event) => {
                                const value = event.value as
                                    | PermissionItem
                                    | undefined;
                                if (value && value.id > 0) {
                                    void selectPermissionDetail(value);
                                }
                            }}
                            paginator={
                                !loading && filteredPermissions.length > 10
                            }
                            rows={10}
                            emptyMessage={
                                <EmptyState
                                    icon="pi-key"
                                    title={
                                        query ||
                                        moduleFilter !== 'ALL' ||
                                        operationFilter !== 'ALL'
                                            ? 'Ningún permiso coincide con la búsqueda.'
                                            : 'No hay permisos registrados.'
                                    }
                                />
                            }
                        >
                            <Column
                                header="Recurso / Módulo"
                                body={resourceBody}
                            />
                            <Column header="Operación" body={operationBody} />
                            <Column
                                header="Método y URL"
                                body={endpointBody}
                            />
                            <Column
                                header="Acciones"
                                body={actionsBody}
                                headerClassName="w-9rem"
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
                                <h5 className="m-0">Detalle del permiso</h5>
                            </div>
                            {selectedPermission && (
                                <Tag
                                    value={`ID: PER-${String(
                                        selectedPermission.id
                                    ).padStart(3, '0')}`}
                                    className="surface-ground text-700"
                                />
                            )}
                        </div>

                        {selectedPermission ? (
                            <div className="flex flex-column gap-3">
                                <div className="flex align-items-center gap-3 p-3 border-round surface-ground border-1 surface-border">
                                    <span className="inline-flex align-items-center justify-content-center border-circle bg-primary w-3rem h-3rem flex-shrink-0">
                                        <i
                                            className="pi pi-key text-xl"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <div className="flex flex-column gap-1">
                                        <span className="text-lg font-bold text-900">
                                            {selectedPermission.operationLabel}{' '}
                                            {selectedPermission.resource}
                                        </span>
                                        <div className="flex align-items-center gap-2 flex-wrap">
                                            <Tag
                                                value={
                                                    selectedPermission.module
                                                }
                                                severity="info"
                                            />
                                            <Tag
                                                value={
                                                    selectedPermission.method
                                                }
                                                severity={methodSeverity(
                                                    selectedPermission.method
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-column gap-2 py-2 border-bottom-1 surface-border text-sm">
                                    <div className="flex justify-content-between">
                                        <span className="text-600">Módulo</span>
                                        <span className="text-900 font-medium">
                                            {selectedPermission.module}
                                        </span>
                                    </div>
                                    <div className="flex justify-content-between">
                                        <span className="text-600">
                                            Recurso
                                        </span>
                                        <span className="text-900 font-medium">
                                            {selectedPermission.resource}
                                        </span>
                                    </div>
                                    <div className="flex justify-content-between">
                                        <span className="text-600">
                                            Operación
                                        </span>
                                        <span className="text-900 font-medium">
                                            {selectedPermission.operationLabel}
                                        </span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600">URL</span>
                                        <code className="text-900 font-semibold">
                                            {selectedPermission.url}
                                        </code>
                                    </div>
                                </div>

                                <div className="p-3 border-round surface-ground border-1 surface-border flex align-items-center justify-content-between">
                                    <div className="flex align-items-center gap-2">
                                        <i
                                            className="pi pi-shield text-primary text-xl"
                                            aria-hidden="true"
                                        />
                                        <span className="text-700 text-sm">
                                            Roles que incluyen este permiso
                                        </span>
                                    </div>
                                    <span className="text-2xl font-bold text-900">
                                        {rolesLoading
                                            ? '…'
                                            : assignedRoles.length}
                                    </span>
                                </div>

                                <div className="flex flex-column gap-2">
                                    <span className="text-900 font-semibold text-sm">
                                        Roles asociados
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {assignedRoles.length > 0 ? (
                                            assignedRoles.map((assignment) => (
                                                <Tag
                                                    key={assignment.id}
                                                    value={`● ${assignment.role.name}`}
                                                    severity={
                                                        assignment.role.active
                                                            ? 'success'
                                                            : 'warning'
                                                    }
                                                />
                                            ))
                                        ) : (
                                            <span className="text-600 text-sm">
                                                Ningún rol tiene este permiso
                                                actualmente.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {canUpdate && (
                                        <Button
                                            label="Editar"
                                            icon="pi pi-pencil"
                                            outlined
                                            size="small"
                                            className="flex-1"
                                            onClick={() =>
                                                openEditDialog(
                                                    selectedPermission
                                                )
                                            }
                                        />
                                    )}
                                    {canDelete && (
                                        <Button
                                            label="Eliminar"
                                            icon="pi pi-trash"
                                            outlined
                                            severity="danger"
                                            size="small"
                                            className="flex-1"
                                            onClick={() =>
                                                handleDeletePermission(
                                                    selectedPermission
                                                )
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                icon="pi-key"
                                title="Selecciona un permiso"
                                description="Haz clic en un permiso de la tabla para ver su detalle y los roles asociados."
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
                                            No se puede eliminar el permiso
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
                header={
                    editingPermission
                        ? 'Editar permiso'
                        : 'Registrar permiso'
                }
                visible={dialogVisible}
                style={{ width: 'min(92vw, 34rem)' }}
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

                    {!editingPermission && (
                        <div className="p-3 border-round surface-ground border-1 surface-border flex flex-column gap-2">
                            <span className="text-700 font-semibold text-xs">
                                Asistente rápido por Recurso y Operación
                            </span>
                            <div className="grid">
                                <div className="col-12 sm:col-6 flex flex-column gap-1">
                                    <label
                                        htmlFor="quick-resource"
                                        className="text-600 text-xs"
                                    >
                                        Recurso / Módulo
                                    </label>
                                    <Dropdown
                                        inputId="quick-resource"
                                        value={quickResourceBase}
                                        options={QUICK_RESOURCES}
                                        optionLabel="label"
                                        optionValue="base"
                                        placeholder="Elegir recurso..."
                                        className="w-full"
                                        onChange={(event) => {
                                            setQuickResourceBase(event.value);
                                            applyQuickSelection(
                                                event.value,
                                                quickOperation
                                            );
                                        }}
                                    />
                                </div>
                                <div className="col-12 sm:col-6 flex flex-column gap-1">
                                    <label
                                        htmlFor="quick-operation"
                                        className="text-600 text-xs"
                                    >
                                        Operación que autoriza
                                    </label>
                                    <Dropdown
                                        inputId="quick-operation"
                                        value={quickOperation}
                                        options={QUICK_OPERATIONS}
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Elegir operación..."
                                        className="w-full"
                                        onChange={(event) => {
                                            setQuickOperation(event.value);
                                            applyQuickSelection(
                                                quickResourceBase,
                                                event.value
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid">
                        <div className="col-12 sm:col-5 flex flex-column gap-2">
                            <label
                                htmlFor="permission-method"
                                className="text-900 font-medium text-sm"
                            >
                                Método HTTP{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                inputId="permission-method"
                                value={formValues.method}
                                options={HTTP_METHODS}
                                optionLabel="label"
                                optionValue="value"
                                className="w-full"
                                onChange={(event) =>
                                    setFormValues((prev) => ({
                                        ...prev,
                                        method: event.value
                                    }))
                                }
                            />
                        </div>

                        <div className="col-12 sm:col-7 flex flex-column gap-2">
                            <label
                                htmlFor="permission-url"
                                className="text-900 font-medium text-sm"
                            >
                                URL del endpoint{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="permission-url"
                                value={formValues.url}
                                maxLength={255}
                                placeholder="/api/torneos/{id}"
                                className={
                                    formSubmitted &&
                                    (!formValues.url.trim() ||
                                        !formValues.url.trim().startsWith('/'))
                                        ? 'p-invalid w-full'
                                        : 'w-full'
                                }
                                onChange={(event) =>
                                    setFormValues((prev) => ({
                                        ...prev,
                                        url: event.target.value
                                    }))
                                }
                            />
                            {formSubmitted &&
                                (!formValues.url.trim() ||
                                    !formValues.url
                                        .trim()
                                        .startsWith('/')) && (
                                    <small className="p-error">
                                        Ingresa una URL válida que inicie con /
                                    </small>
                                )}
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

