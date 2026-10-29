'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import PersonalDataForm from '@/components/profile/PersonalDataForm';
import PageHeader from '@/components/ui/PageHeader';
import ProfileAvatar from '@/components/ui/ProfileAvatar';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import {
    USER_DEACTIVATE_ENDPOINT,
    USER_DETAIL_ENDPOINTS,
    USER_PROFILE_EDIT_ENDPOINTS,
    USER_REACTIVATE_ENDPOINT,
    USER_ROLES_VIEW_ENDPOINTS,
    USER_UPDATE_ENDPOINT
} from '@/lib/security-constants';
import { ActionResult } from '@/types/action';
import { PersonalDataInput } from '@/types/profile';
import { EndpointRequirement, UserAccount, UserFormValues, UserProfileData } from '@/types/security';
import { confirmUserStatusChange } from '../components/confirmUserStatusChange';
import { AuthProviderTag, UserStatusTag } from '../components/UserBadges';
import UserFormDialog from '../components/UserFormDialog';
import { useUserDetail } from '../hooks/useUserDetail';

interface UserDetailPageProps {
    params: { id: string };
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
    return (
        <ProtectedRoute requiredEndpoints={USER_DETAIL_ENDPOINTS}>
            <UserDetailContent userId={Number(params.id)} />
        </ProtectedRoute>
    );
}

function UserDetailContent({ userId }: { userId: number }) {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl, user: currentUser } = useAuth();
    const { user, profile, loading, loadError, savingProfile, update, setEnabled, saveProfile, reload } = useUserDetail(userId);
    const [editing, setEditing] = useState(false);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const isMe = currentUser?.id === userId;

    const notify = (result: ActionResult, successText: string) =>
        toast.current?.show(
            result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: 'No se pudo completar', detail: result.error, life: 5000 }
        );

    const handleUpdate = async (values: UserFormValues) => {
        const result = await update(values);
        if (result.ok) notify(result, 'Usuario actualizado.');
        return result;
    };

    const handleSaveProfile = async (data: PersonalDataInput) => notify(await saveProfile(data), 'Perfil guardado.');

    const handleStatus = (account: UserAccount, enabled: boolean) =>
        confirmUserStatusChange(account, enabled, async () => notify(await setEnabled(enabled), enabled ? 'Usuario reactivado.' : 'Usuario desactivado.'));

    const actions = user && (
        <div className="flex flex-wrap gap-2">
            {can(USER_UPDATE_ENDPOINT) && <Button label="Editar" icon="pi pi-pencil" outlined onClick={() => setEditing(true)} />}
            {can(...USER_ROLES_VIEW_ENDPOINTS) && <Button label="Gestionar roles" icon="pi pi-shield" outlined onClick={() => router.push(`/usuarios/${userId}/roles`)} />}
            {user.enabled && !isMe && can(USER_DEACTIVATE_ENDPOINT) && <Button label="Desactivar" icon="pi pi-ban" severity="danger" outlined onClick={() => handleStatus(user, false)} />}
            {!user.enabled && can(USER_REACTIVATE_ENDPOINT) && <Button label="Reactivar" icon="pi pi-check-circle" severity="success" onClick={() => handleStatus(user, true)} />}
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title={user?.name ?? 'Detalle del usuario'}
                subtitle="Información de la cuenta y perfil del usuario."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Usuarios', href: '/usuarios' }, { label: user?.name ?? 'Detalle' }]}
                actions={actions}
            />

            {loadError && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={loadError} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            {loading && !user && (
                <div className="grid">
                    <div className="col-12 lg:col-4">
                        <Skeleton height="18rem" />
                    </div>
                    <div className="col-12 lg:col-8">
                        <Skeleton height="18rem" />
                    </div>
                </div>
            )}

            {user && (
                <div className="grid">
                    <div className="col-12 lg:col-4">
                        <AccountCard user={user} photoUrl={profile?.photoUrl ?? null} />
                    </div>
                    <div className="col-12 lg:col-8">
                        {can(...USER_PROFILE_EDIT_ENDPOINTS) ? (
                            <PersonalDataForm title="Perfil" profile={profile ?? { phone: null, birthDate: null }} saving={savingProfile} onSave={handleSaveProfile} />
                        ) : (
                            <ProfileReadOnly profile={profile} />
                        )}
                    </div>
                </div>
            )}

            <UserFormDialog visible={editing} user={user} onHide={() => setEditing(false)} onSubmit={handleUpdate} />
        </>
    );
}

function AccountCard({ user, photoUrl }: { user: UserAccount; photoUrl: string | null }) {
    return (
        <div className="card flex flex-column align-items-center text-center h-full">
            <ProfileAvatar name={user.name} photoUrl={photoUrl} className="mb-3" />
            <div className="text-900 text-xl font-medium">{user.name}</div>
            <div className="text-600 mb-3">{user.email}</div>
            <div className="flex gap-2 justify-content-center">
                <AuthProviderTag provider={user.authProvider} />
                <UserStatusTag enabled={user.enabled} />
            </div>
        </div>
    );
}

function ProfileReadOnly({ profile }: { profile: UserProfileData | null }) {
    return (
        <div className="card h-full">
            <h5>Perfil</h5>
            {profile ? (
                <ul className="list-none p-0 m-0">
                    <li className="mb-2">
                        <span className="text-600">Teléfono: </span>
                        {profile.phone ?? 'Sin registrar'}
                    </li>
                    <li>
                        <span className="text-600">Fecha de nacimiento: </span>
                        {profile.birthDate ?? 'Sin registrar'}
                    </li>
                </ul>
            ) : (
                <p className="text-600 m-0">Este usuario todavía no ha completado su perfil.</p>
            )}
        </div>
    );
}
