import { Avatar } from 'primereact/avatar';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { getInitials } from '@/lib/format';
import { RoleSummary } from '@/types/security';
import styles from '../home.module.scss';

interface WelcomeCardProps {
    greeting: string;
    userName: string;
    email: string;
    roles: RoleSummary[];
    loading: boolean;
}

export default function WelcomeCard({ greeting, userName, email, roles, loading }: WelcomeCardProps) {
    if (loading) {
        return (
            <div className={`card ${styles.welcome}`} aria-busy="true">
                <Skeleton shape="circle" size="4.5rem" />
                <div className="flex flex-column gap-2 flex-1">
                    <Skeleton width="14rem" height="1.75rem" />
                    <Skeleton width="10rem" />
                    <Skeleton width="8rem" height="1.5rem" />
                </div>
            </div>
        );
    }

    return (
        <section className={`card ${styles.welcome}`} aria-labelledby="welcome-title">
            <Avatar label={getInitials(userName)} shape="circle" size="xlarge" className={styles.welcomeAvatar} aria-hidden="true" />
            <div className="flex flex-column gap-2 flex-1 min-w-0">
                <h1 id="welcome-title" className="text-900 text-2xl md:text-3xl font-bold m-0">
                    {userName ? `${greeting}, ${userName}` : greeting}
                </h1>
                <span className="text-600 overflow-hidden text-overflow-ellipsis">{email}</span>
                <div className="flex flex-wrap align-items-center gap-2 mt-1">
                    <span className="text-700 text-sm font-medium">Tus roles:</span>
                    {roles.length > 0 ? roles.map((role) => <Tag key={role.id} value={role.name} icon="pi pi-shield" rounded />) : <span className="text-600 text-sm">Aún no tienes roles asignados</span>}
                </div>
            </div>
        </section>
    );
}
