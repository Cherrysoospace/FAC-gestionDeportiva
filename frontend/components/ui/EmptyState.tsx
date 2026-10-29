import { ReactNode } from 'react';
import styles from './ui.module.scss';

interface EmptyStateProps {
    title: string;
    icon?: string;
    description?: string;
    action?: ReactNode;
}

export default function EmptyState({
    title,
    icon = 'pi-inbox',
    description,
    action
}: EmptyStateProps) {
    return (
        <div className={styles.emptyState} role="status">
            <i className={`pi ${icon} text-3xl text-400`} aria-hidden="true" />
            <span className="text-900 font-medium">{title}</span>
            {description && (
                <span className="text-600 text-sm line-height-3">
                    {description}
                </span>
            )}
            {action}
        </div>
    );
}
