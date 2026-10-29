'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { getInitials } from '@/lib/format';
import {
    USER_ROLES_VIEW_ENDPOINTS,
    USERS_VIEW_ENDPOINTS
} from '@/lib/security-constants';
import { UserSummary } from '@/types/security';
import { useUsers } from './hooks/useUsers';

const SKELETON_ROWS: UserSummary[] = Array.from({ length: 5 }, (_, index) => ({
    id: -(index + 1),
    name: '',
    email: ''
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
    const { hasPermissionUrl } = useAuth();
    const { users, loading, error, reload } = useUsers();
    const [query, setQuery] = useState('');

    const canManageRoles = USER_ROLES_VIEW_ENDPOINTS.every((endpoint) =>
        hasPermissionUrl(endpoint.url, endpoint.method)
    );

    const nameBody = (user: UserSummary) =>
        loading ? (
            <div className="flex align-items-center gap-2">
                <Skeleton shape="circle" size="2rem" />
                <Skeleton width="10rem" />
            </div>
        ) : (
            <div className="flex align-items-center gap-2">
                <Avatar
                    label={getInitials(user.name)}
                    shape="circle"
                    aria-hidden="true"
                />
                <span className="text-900 font-medium">{user.name}</span>
            </div>
        );

    const emailBody = (user: UserSummary) =>
        loading ? <Skeleton width="12rem" /> : user.email;

    const actionsBody = (user: UserSummary) =>
        loading ? (
            <Skeleton width="9rem" height="2rem" />
        ) : (
            <Button
                type="button"
                label="Gestionar roles"
                icon="pi pi-shield"
                text
                aria-label={`Gestionar roles de ${user.name}`}
                onClick={() => router.push(`/usuarios/${user.id}/roles`)}
            />
        );

    return (
        <>
            <PageHeader
                title="Usuarios"
                subtitle="Consulta los usuarios registrados y gestiona los roles que tiene cada uno."
                breadcrumb={[{ label: 'Usuarios' }]}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button
                        label="Reintentar"
                        icon="pi pi-refresh"
                        outlined
                        onClick={reload}
                    />
                </div>
            )}

            <div className="card">
                <div className="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3 mb-3">
                    <h5 className="m-0">Listado de usuarios</h5>
                    <SearchInput
                        value={query}
                        onChange={setQuery}
                        ariaLabel="Buscar usuarios por nombre o correo"
                        placeholder="Buscar por nombre o correo"
                        disabled={loading}
                    />
                </div>

                <DataTable
                    value={loading ? SKELETON_ROWS : users}
                    dataKey="id"
                    globalFilter={query}
                    globalFilterFields={['name', 'email']}
                    paginator={!loading && users.length > 10}
                    rows={10}
                    emptyMessage={
                        <EmptyState
                            icon="pi-users"
                            title={
                                query
                                    ? 'Ningún usuario coincide con la búsqueda.'
                                    : 'No hay usuarios registrados.'
                            }
                        />
                    }
                >
                    <Column header="Nombre" body={nameBody} />
                    <Column header="Correo" body={emailBody} />
                    {canManageRoles && (
                        <Column
                            header="Acciones"
                            body={actionsBody}
                            headerClassName="w-12rem"
                        />
                    )}
                </DataTable>
            </div>
        </>
    );
}
