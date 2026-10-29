'use client';

import { ReactNode } from 'react';
import AssignmentPanel, { ItemKey } from './AssignmentPanel';

export interface DualListLabels {
    assignedTitle: string;
    availableTitle: string;
    assignAction: string;
    removeAction: string;
    emptyAssigned: string;
    emptyAvailable: string;
    noMatches?: string;
}

interface DualListSelectorProps<T> {
    assigned: T[];
    available: T[];
    getKey: (item: T) => ItemKey;
    getSearchText: (item: T) => string;
    renderItem: (item: T) => ReactNode;
    labels: DualListLabels;
    onAssign?: (item: T) => void;
    onRemove?: (item: T) => void;
    getActionAriaLabel?: (item: T, action: 'assign' | 'remove') => string;
    pendingKeys?: ReadonlySet<ItemKey>;
    disabled?: boolean;
    loading?: boolean;
}

export default function DualListSelector<T>({
    assigned,
    available,
    getKey,
    getSearchText,
    renderItem,
    labels,
    onAssign,
    onRemove,
    getActionAriaLabel,
    pendingKeys,
    disabled = false,
    loading = false
}: DualListSelectorProps<T>) {
    return (
        <div className="grid">
            <div className="col-12 lg:col-6">
                <AssignmentPanel<T>
                    title={labels.assignedTitle}
                    items={assigned}
                    getKey={getKey}
                    getSearchText={getSearchText}
                    renderItem={renderItem}
                    pendingKeys={pendingKeys}
                    disabled={disabled}
                    loading={loading}
                    emptyMessage={labels.emptyAssigned}
                    noMatchesMessage={labels.noMatches}
                    action={
                        onRemove && {
                            label: labels.removeAction,
                            icon: 'pi pi-minus-circle',
                            severity: 'danger',
                            outlined: true,
                            onClick: onRemove,
                            getAriaLabel:
                                getActionAriaLabel &&
                                ((item) => getActionAriaLabel(item, 'remove'))
                        }
                    }
                />
            </div>
            <div className="col-12 lg:col-6">
                <AssignmentPanel<T>
                    title={labels.availableTitle}
                    items={available}
                    getKey={getKey}
                    getSearchText={getSearchText}
                    renderItem={renderItem}
                    pendingKeys={pendingKeys}
                    disabled={disabled}
                    loading={loading}
                    emptyMessage={labels.emptyAvailable}
                    emptyIcon="pi-check-circle"
                    noMatchesMessage={labels.noMatches}
                    action={
                        onAssign && {
                            label: labels.assignAction,
                            icon: 'pi pi-plus-circle',
                            onClick: onAssign,
                            getAriaLabel:
                                getActionAriaLabel &&
                                ((item) => getActionAriaLabel(item, 'assign'))
                        }
                    }
                />
            </div>
        </div>
    );
}
