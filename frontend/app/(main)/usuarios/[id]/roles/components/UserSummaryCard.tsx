import { Avatar } from 'primereact/avatar';
import { Skeleton } from 'primereact/skeleton';
import { getInitials } from '@/lib/format';

interface UserSummaryCardProps {
    name?: string;
    email?: string;
    loading?: boolean;
}

export default function UserSummaryCard({
    name,
    email,
    loading = false
}: UserSummaryCardProps) {
    return (
        <section className="card mb-4" aria-label="Datos del usuario">
            <h5 className="mt-0 mb-3">Usuario</h5>
            {loading || !name ? (
                <div className="flex align-items-center gap-3">
                    <Skeleton shape="circle" size="3.5rem" />
                    <div className="flex-1 flex flex-column gap-2">
                        <Skeleton width="70%" height="1.25rem" />
                        <Skeleton width="90%" />
                    </div>
                </div>
            ) : (
                <div className="flex align-items-center gap-3">
                    <Avatar
                        label={getInitials(name)}
                        size="xlarge"
                        shape="circle"
                        className="flex-shrink-0"
                        aria-hidden="true"
                    />
                    <div className="flex flex-column gap-1 min-w-0">
                        <span className="text-900 font-medium text-lg">
                            {name}
                        </span>
                        <span className="flex align-items-center gap-2 text-600 text-sm white-space-nowrap overflow-hidden text-overflow-ellipsis">
                            <i className="pi pi-envelope" aria-hidden="true" />
                            {email}
                        </span>
                    </div>
                </div>
            )}
        </section>
    );
}
