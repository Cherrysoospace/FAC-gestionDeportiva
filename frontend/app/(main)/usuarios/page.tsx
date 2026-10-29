'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { getInitials } from '@/lib/format';
import {
    USER_CREATE_ENDPOINT,
    USER_DEACTIVATE_ENDPOINT,
    USER_DETAIL_ENDPOINTS,
    USER_REACTIVATE_ENDPOINT,
    USER_ROLES_VIEW_ENDPOINTS,
    USER_UPDATE_ENDPOINT,
    USERS_VIEW_ENDPOINTS
} from '@/lib/security-constants';
import { ActionResult } from '@/types/action';
import { EndpointRequirement, UserAccount, UserFormValues } from '@/types/security';
import { confirmUserStatusChange } from './components/confirmUserStatusChange';
import { AuthProviderTag, UserStatusTag } from './components/UserBadges';
import UserFormDialog from './components/UserFormDialog';
import { useUsers } from './hooks/useUsers';

const SKELETON_ROWS: UserAccount[] = Array.from({ length: 5 }, (_, index) => ({
    id: -(index + 1),
    name: '',
    email: '',
    enabled: true,
    authProvider: 'LOCAL'
}));

export default function UsersPage() {
    return (
        <ProtectedRoute requiredEndpoints={USERS_VIEW_ENDPOINTS}>
            <UsersContent />
        </ProtectedRoute>
    );
}

function UsersContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl, user: currentUser } = useAuth();
    const { users, loading, error, reload, create, update, setEnabled } = useUsers();
    const [query, setQuery] = useState('');
    const [dialog, setDialog] = useState<{ visible: boolean; user: UserAccount | null }>({ visible: false, user: null });

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canCreate = can(USER_CREATE_ENDPOINT);
    const canUpdate = can(USER_UPDATE_ENDPOINT);
    const canDeactivate = can(USER_DEACTIVATE_ENDPOINT);
    const canReactivate = can(USER_REACTIVATE_ENDPOINT);
    const canViewDetail = can(...USER_DETAIL_ENDPOINTS);
    const canManageRoles = can(...USER_ROLES_VIEW_ENDPOINTS);
    const hasActions = canUpdate || canDeactivate || canReactivate || canViewDetail || canManageRoles;

    const notify = (result: ActionResult, successText: string) =>
        toast.current?.show(
            result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: 'No se pudo completar', detail: result.error, life: 5000 }
        );

    const handleSubmit = async (values: UserFormValues): Promise<ActionResult> => {
        const editing = dialog.user;
        const result = editing ? await update(editing.id, values) : await create(values);
        if (result.ok) notify(result, editing ? 'Usuario actualizado.' : 'Usuario creado. Ahora puedes asignarle roles.');
        return result;
    };

    const handleStatus = (user: UserAccount, enabled: boolean) =>
        confirmUserStatusChange(user, enabled, async () => notify(await setEnabled(user, enabled), enabled ? `${user.name} fue reactivado.` : `${user.name} fue desactivado.`));

    const nameBody = (user: UserAccount) =>
        loading ? (
            <div className="flex align-items-center gap-2">
                <Skeleton shape="circle" size="2rem" />
                <Skeleton width="10rem" />
            </div>
        ) : (
            <div className="flex align-items-center gap-2">
                <Avatar label={getInitials(user.name)} shape="circle" aria-hidden="true" />
                <span className={user.enabled ? 'text-900 font-medium' : 'text-500 font-medium'}>{user.name}</span>
            </div>
        );

    const emailBody = (user: UserAccount) => (loading ? <Skeleton width="12rem" /> : user.email);
    const providerBody = (user: UserAccount) => (loading ? <Skeleton width="6rem" /> : <AuthProviderTag provider={user.authProvider} />);
    const statusBody = (user: UserAccount) => (loading ? <Skeleton width="4rem" /> : <UserStatusTag enabled={user.enabled} />);

    const actionsBody = (user: UserAccount) => {
        if (loading) return <Skeleton width="10rem" height="2rem" />;
        const isMe = currentUser?.id === user.id;

        return (
            <div className="flex gap-1">
                {canViewDetail && <Button icon="pi pi-eye" rounded text tooltip="Ver detalle y perfil" tooltipOptions={{ position: 'top' }} aria-label={`Ver detalle de ${user.name}`} onClick={() => router.push(`/usuarios/${user.id}`)} />}
                {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar a ${user.name}`} onClick={() => setDialog({ visible: true, user })} />}
                {canManageRoles && <Button icon="pi pi-shield" rounded text tooltip="Gestionar roles" tooltipOptions={{ position: 'top' }} aria-label={`Gestionar roles de ${user.name}`} onClick={() => router.push(`/usuarios/${user.id}/roles`)} />}
                {user.enabled && canDeactivate && !isMe && <Button icon="pi pi-ban" rounded text severity="danger" tooltip="Desactivar" tooltipOptions={{ position: 'top' }} aria-label={`Desactivar a ${user.name}`} onClick={() => handleStatus(user, false)} />}
                {!user.enabled && canReactivate && <Button icon="pi pi-check-circle" rounded text severity="success" tooltip="Reactivar" tooltipOptions={{ position: 'top' }} aria-label={`Reactivar a ${user.name}`} onClick={() => handleStatus(user, true)} />}
            </div>
        );
    };

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Usuarios"
                subtitle="Registra, consulta, edita y desactiva usuarios. Desde aquí también puedes ver su perfil y sus roles."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Usuarios' }]}
                actions={canCreate && <Button label="Nuevo usuario" icon="pi pi-user-plus" onClick={() => setDialog({ visible: true, user: null })} />}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            <div className="card">
                <div className="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3 mb-3">
                    <h5 className="m-0">Listado de usuarios</h5>
                    <SearchInput value={query} onChange={setQuery} ariaLabel="Buscar usuarios por nombre o correo" placeholder="Buscar por nombre o correo" disabled={loading} />
                </div>

                <DataTable
                    value={loading ? SKELETON_ROWS : users}
                    dataKey="id"
                    globalFilter={query}
                    globalFilterFields={['name', 'email']}
                    paginator={!loading && users.length > 10}
                    rows={10}
                    emptyMessage={<EmptyState icon="pi-users" title={query ? 'Ningún usuario coincide con la búsqueda.' : 'No hay usuarios registrados.'} />}
                >
                    <Column header="Nombre" body={nameBody} />
                    <Column header="Correo" body={emailBody} />
                    <Column header="Acceso" body={providerBody} />
                    <Column header="Estado" body={statusBody} />
                    {hasActions && <Column header="Acciones" body={actionsBody} headerClassName="w-14rem" />}
                </DataTable>
            </div>

            <UserFormDialog visible={dialog.visible} user={dialog.user} onHide={() => setDialog({ visible: false, user: null })} onSubmit={handleSubmit} />
        </>
    );
}
