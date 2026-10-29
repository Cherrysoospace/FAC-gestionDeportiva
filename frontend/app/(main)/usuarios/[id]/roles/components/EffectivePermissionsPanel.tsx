import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import { PermissionItem, PermissionModule } from '@/types/security';
import styles from '../userRoles.module.scss';

interface EffectivePermissionsPanelProps {
    modules: PermissionModule[];
    total: number;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
}

const SKELETON_ROWS = [0, 1, 2, 3];

// Varios endpoints pueden compartir operación (p. ej. dos GET de "Ver").
function groupByOperation(permissions: PermissionItem[]) {
    const groups = new Map<string, PermissionItem[]>();

    permissions.forEach((permission) => {
        const items = groups.get(permission.operationLabel) ?? [];
        items.push(permission);
        groups.set(permission.operationLabel, items);
    });

    return Array.from(groups.entries());
}

export default function EffectivePermissionsPanel({
    modules,
    total,
    loading = false,
    error,
    onRetry
}: EffectivePermissionsPanelProps) {
    const renderBody = () => {
        if (error) {
            return (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3">
                    <Message severity="error" text={error} className="w-full" />
                    {onRetry && (
                        <Button
                            label="Reintentar"
                            icon="pi pi-refresh"
                            outlined
                            onClick={onRetry}
                        />
                    )}
                </div>
            );
        }

        if (loading) {
            return (
                <div className="flex flex-column gap-3" aria-busy="true">
                    {SKELETON_ROWS.map((row) => (
                        <div
                            key={row}
                            className="flex align-items-center gap-3"
                        >
                            <Skeleton width="8rem" />
                            <Skeleton width="4rem" height="1.5rem" />
                            <Skeleton width="4rem" height="1.5rem" />
                        </div>
                    ))}
                </div>
            );
        }

        if (modules.length === 0) {
            return (
                <EmptyState
                    icon="pi-key"
                    title="Sin permisos efectivos"
                    description="Asigna al menos un rol para que el usuario obtenga permisos."
                />
            );
        }

        return (
            <div className="grid">
                {modules.map((permissionModule) => (
                    <div
                        key={permissionModule.name}
                        className="col-12 xl:col-6"
                    >
                        <div className={styles.moduleBox}>
                            <h6 className="mt-0 mb-2 text-primary">
                                {permissionModule.name}
                            </h6>
                            <ul className={styles.resourceList}>
                                {permissionModule.resources.map((resource) => (
                                    <li
                                        key={resource.name}
                                        className={styles.resourceRow}
                                    >
                                        <span className="text-900 font-medium text-sm">
                                            {resource.name}
                                        </span>
                                        <span className="flex flex-wrap gap-1">
                                            {groupByOperation(
                                                resource.permissions
                                            ).map(([label, items]) => (
                                                <Tag
                                                    key={label}
                                                    value={label}
                                                    severity="success"
                                                    title={items
                                                        .map(
                                                            (item) =>
                                                                `${item.method} ${item.url}`
                                                        )
                                                        .join('\n')}
                                                />
                                            ))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <section className="card" aria-labelledby="effective-permissions-title">
            <div className="flex align-items-center justify-content-between gap-2 mb-1">
                <h5 id="effective-permissions-title" className="m-0">
                    Permisos efectivos
                </h5>
                <Tag
                    value={loading ? '…' : String(total)}
                    severity="info"
                    rounded
                    aria-label={`${total} permisos efectivos`}
                />
            </div>
            <p className="text-600 text-sm mt-0 mb-3">
                Unión de los permisos de todos los roles asignados, agrupados
                por módulo. Solo lectura.
            </p>
            {renderBody()}
        </section>
    );
}
