import { Tag } from 'primereact/tag';
import { authProviderLabel } from '@/lib/profile-rules';

export function UserStatusTag({ enabled }: { enabled: boolean }) {
    return enabled ? <Tag value="Activo" severity="success" /> : <Tag value="Inactivo" severity="danger" />;
}

export function AuthProviderTag({ provider }: { provider: string }) {
    const isLocal = provider === 'LOCAL';
    return <Tag value={authProviderLabel(provider)} icon={isLocal ? 'pi pi-envelope' : 'pi pi-globe'} severity={isLocal ? 'info' : 'warning'} />;
}
