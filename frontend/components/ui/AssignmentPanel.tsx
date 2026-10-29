'use client';

import { ReactNode, useId, useMemo, useState } from 'react';
import { Button, ButtonProps } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import EmptyState from './EmptyState';
import SearchInput from './SearchInput';
import styles from './ui.module.scss';

export type ItemKey = number | string;

export interface AssignmentAction<T> {
    label: string;
    icon: string;
    severity?: ButtonProps['severity'];
    outlined?: boolean;
    onClick: (item: T) => void;
    getAriaLabel?: (item: T) => string;
}

export interface AssignmentPanelProps<T> {
    title: string;
    items: T[];
    getKey: (item: T) => ItemKey;
    getSearchText: (item: T) => string;
    renderItem: (item: T) => ReactNode;
    action?: AssignmentAction<T>;
    pendingKeys?: ReadonlySet<ItemKey>;
    disabled?: boolean;
    loading?: boolean;
    emptyMessage: string;
    emptyIcon?: string;
    noMatchesMessage?: string;
}

const SKELETON_ROWS = [0, 1, 2];

export default function AssignmentPanel<T>({
    title,
    items,
    getKey,
    getSearchText,
    renderItem,
    action,
    pendingKeys,
    disabled = false,
    loading = false,
    emptyMessage,
    emptyIcon,
    noMatchesMessage = 'Ningún elemento coincide con la búsqueda.'
}: AssignmentPanelProps<T>) {
    const headingId = useId();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        if (!term) {
            return items;
        }

        return items.filter((item) =>
            getSearchText(item).toLowerCase().includes(term)
        );
    }, [items, query, getSearchText]);

    const renderBody = () => {
        if (loading) {
            return (
                <ul className={styles.assignmentList} aria-busy="true">
                    {SKELETON_ROWS.map((row) => (
                        <li key={row} className={styles.assignmentItem}>
                            <div className="flex-1 flex flex-column gap-2">
                                <Skeleton width="40%" height="1rem" />
                                <Skeleton width="70%" height="0.75rem" />
                            </div>
                            <Skeleton width="5.5rem" height="2rem" />
                        </li>
                    ))}
                </ul>
            );
        }

        if (items.length === 0) {
            return <EmptyState title={emptyMessage} icon={emptyIcon} />;
        }

        if (filtered.length === 0) {
            return <EmptyState title={noMatchesMessage} icon="pi-search" />;
        }

        return (
            <ul className={styles.assignmentList}>
                {filtered.map((item) => {
                    const key = getKey(item);
                    const pending = pendingKeys?.has(key) ?? false;

                    return (
                        <li key={key} className={styles.assignmentItem}>
                            <div className="flex-1 min-w-0">
                                {renderItem(item)}
                            </div>
                            {action && (
                                <Button
                                    type="button"
                                    size="small"
                                    label={action.label}
                                    icon={action.icon}
                                    severity={action.severity}
                                    outlined={action.outlined}
                                    loading={pending}
                                    disabled={disabled || pending}
                                    aria-label={action.getAriaLabel?.(item)}
                                    onClick={() => action.onClick(item)}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <section className="card h-full mb-0" aria-labelledby={headingId}>
            <div className="flex align-items-center justify-content-between gap-2 mb-3">
                <h5 id={headingId} className="m-0">
                    {title}
                </h5>
                <Tag
                    value={loading ? '…' : String(items.length)}
                    severity="info"
                    rounded
                    aria-label={`${items.length} elementos`}
                />
            </div>
            <SearchInput
                value={query}
                onChange={setQuery}
                ariaLabel={`Buscar en ${title.toLowerCase()}`}
                disabled={loading || items.length === 0}
                className="w-full mb-3"
            />
            {renderBody()}
        </section>
    );
}
