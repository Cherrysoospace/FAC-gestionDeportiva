import { ReactNode } from 'react';
import { Skeleton } from 'primereact/skeleton';
import styles from './ui.module.scss';

interface StatCardProps {
    label: string;
    value: ReactNode;
    icon?: string;
    loading?: boolean;
}

export default function StatCard({
    label,
    value,
    icon,
    loading = false
}: StatCardProps) {
    return (
        <div className={styles.statCard}>
            <span className="flex align-items-center gap-2 text-600 text-sm">
                {icon && (
                    <i className={`pi ${icon} text-primary`} aria-hidden="true" />
                )}
                {label}
            </span>
            {loading ? (
                <Skeleton width="3rem" height="2rem" />
            ) : (
                <span className="text-2xl font-bold text-900">{value}</span>
            )}
        </div>
    );
}
