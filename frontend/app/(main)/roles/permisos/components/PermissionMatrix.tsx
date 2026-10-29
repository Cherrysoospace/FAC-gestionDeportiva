'use client';

import { useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import {
    PermissionCatalog,
    PermissionItem,
    PermissionModule,
    PermissionOperation,
    PermissionResource
} from '@/types/security';
import styles from '../permissions.module.scss';

const OPERATIONS: Array<{
    key: PermissionOperation;
    label: string;
}> = [
    { key: 'VER', label: 'Ver' },
    { key: 'LISTAR', label: 'Listar' },
    { key: 'CREAR', label: 'Crear' },
    { key: 'ACTUALIZAR', label: 'Actualizar' },
    { key: 'ELIMINAR', label: 'Eliminar' }
];

interface PermissionMatrixProps {
    catalog: PermissionCatalog | null;
    selectedIds: Set<number>;
    disabled?: boolean;
    onToggle: (permissionIds: number[], checked: boolean) => void;
}

function modulePermissionIds(permissionModule: PermissionModule): number[] {
    return permissionModule.resources.flatMap((resource) =>
        resource.permissions.map((permission) => permission.id)
    );
}

function permissionsForOperation(
    resource: PermissionResource,
    operation: PermissionOperation
): PermissionItem[] {
    return resource.permissions.filter(
        (permission) => permission.operation === operation
    );
}

// Deja solo los recursos cuyo nombre (o el de su módulo) contiene el texto buscado.
function filterModules(modules: PermissionModule[], query: string): PermissionModule[] {
    const term = query.trim().toLowerCase();
    if (!term) return modules;

    return modules
        .map((permissionModule) =>
            permissionModule.name.toLowerCase().includes(term)
                ? permissionModule
                : {
                      ...permissionModule,
                      resources: permissionModule.resources.filter((resource) =>
                          resource.name.toLowerCase().includes(term)
                      )
                  }
        )
        .filter((permissionModule) => permissionModule.resources.length > 0);
}

export default function PermissionMatrix({
    catalog,
    selectedIds,
    disabled = false,
    onToggle
}: PermissionMatrixProps) {
    const [activeModules, setActiveModules] = useState<number[]>([]);
    const [query, setQuery] = useState('');
    const visibleModules = useMemo(
        () => filterModules(catalog?.modules ?? [], query),
        [catalog, query]
    );
    // Al buscar se despliegan todos los módulos con coincidencias
    const activeIndex = query.trim()
        ? visibleModules.map((_, index) => index)
        : activeModules;

    useEffect(() => {
        setActiveModules(
            catalog ? catalog.modules.map((_, index) => index) : []
        );
    }, [catalog]);

    const moduleStats = useMemo(() => {
        const stats = new Map<string, { assigned: number; total: number }>();

        for (const permissionModule of catalog?.modules ?? []) {
            const ids = modulePermissionIds(permissionModule);
            stats.set(permissionModule.name, {
                assigned: ids.filter((id) => selectedIds.has(id)).length,
                total: ids.length
            });
        }

        return stats;
    }, [catalog, selectedIds]);

    if (!catalog || catalog.modules.length === 0) {
        return (
            <div className="card">
                <EmptyState
                    icon="pi-key"
                    title="Todavía no hay permisos registrados"
                    description="Cuando se registren permisos en el sistema podrás asignarlos a los roles desde aquí."
                />
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex flex-column md:flex-row md:align-items-start md:justify-content-between gap-3 mb-3">
                <div className="flex flex-column gap-1">
                    <h5 className="m-0">Permisos del rol</h5>
                    <span className="text-600 text-sm">
                        Marca las acciones que podrá realizar el rol en cada
                        sección. El contador junto a una casilla indica cuántos
                        permisos del grupo están asignados.
                    </span>
                </div>
                <SearchInput
                    value={query}
                    onChange={setQuery}
                    ariaLabel="Buscar permisos por recurso o módulo"
                    placeholder="Buscar recurso o módulo"
                />
            </div>

            {selectedIds.size === 0 && (
                <Message
                    severity="info"
                    className="w-full mb-3"
                    text="Este rol no tiene permisos asignados actualmente."
                />
            )}

            {visibleModules.length === 0 && (
                <EmptyState
                    icon="pi-search"
                    title="Ningún recurso coincide con la búsqueda."
                    description="Prueba con otro nombre o borra el texto para ver todos los permisos."
                />
            )}

            <Accordion
                multiple
                activeIndex={activeIndex}
                onTabChange={(event) => {
                    if (query.trim()) return;
                    const index = event.index;
                    setActiveModules(
                        Array.isArray(index)
                            ? index
                            : typeof index === 'number'
                              ? [index]
                              : []
                    );
                }}
            >
                {visibleModules.map((permissionModule) => {
                    const stats = moduleStats.get(permissionModule.name);

                    return (
                        <AccordionTab
                            key={permissionModule.name}
                            header={
                                <div className="flex align-items-center justify-content-between w-full pr-2 gap-3">
                                    <span className="font-medium text-900">
                                        {permissionModule.name}
                                    </span>
                                    <span className="text-600 text-sm">
                                        {stats?.assigned ?? 0} /{' '}
                                        {stats?.total ?? 0} permisos
                                    </span>
                                </div>
                            }
                        >
                            <div className={styles.matrixWrapper}>
                                <table className={styles.matrixTable}>
                                    <thead>
                                        <tr>
                                            <th scope="col" className="text-left">
                                                Recurso
                                            </th>
                                            {OPERATIONS.map((operation) => (
                                                <th
                                                    key={operation.key}
                                                    scope="col"
                                                >
                                                    {operation.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {permissionModule.resources.map((resource) => (
                                            <tr key={resource.name}>
                                                <td
                                                    role="rowheader"
                                                    className={styles.resourceName}
                                                >
                                                    {resource.name}
                                                </td>
                                                {OPERATIONS.map((operation) => {
                                                    const permissions =
                                                        permissionsForOperation(
                                                            resource,
                                                            operation.key
                                                        );

                                                    if (permissions.length === 0) {
                                                        return (
                                                            <td
                                                                key={
                                                                    operation.key
                                                                }
                                                                className={
                                                                    styles.checkboxCell
                                                                }
                                                            >
                                                                <span className="text-400">
                                                                    —
                                                                </span>
                                                            </td>
                                                        );
                                                    }

                                                    const selectedCount =
                                                        permissions.filter(
                                                            (permission) =>
                                                                selectedIds.has(
                                                                    permission.id
                                                                )
                                                        ).length;
                                                    const allSelected =
                                                        selectedCount ===
                                                        permissions.length;
                                                    const inputId = `permission-group-${permissions[0].id}`;
                                                    const groupLabel = `${operation.label} ${resource.name}`;
                                                    const permissionUrls =
                                                        permissions
                                                            .map(
                                                                (permission) =>
                                                                    `${permission.method} ${permission.url}`
                                                            )
                                                            .join('\n');

                                                    return (
                                                        <td
                                                            key={operation.key}
                                                            className={
                                                                styles.checkboxCell
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles.permissionGroup
                                                                }
                                                            >
                                                                <Checkbox
                                                                    inputId={
                                                                        inputId
                                                                    }
                                                                    inputRef={(
                                                                        element
                                                                    ) => {
                                                                        if (
                                                                            element
                                                                        ) {
                                                                            element.indeterminate =
                                                                                selectedCount >
                                                                                    0 &&
                                                                                !allSelected;
                                                                        }
                                                                    }}
                                                                    checked={
                                                                        allSelected
                                                                    }
                                                                    disabled={
                                                                        disabled
                                                                    }
                                                                    aria-label={`${groupLabel}${permissions.length > 1 ? ` (${permissions.length} permisos)` : ''}`}
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        onToggle(
                                                                            permissions.map(
                                                                                (
                                                                                    permission
                                                                                ) =>
                                                                                    permission.id
                                                                            ),
                                                                            Boolean(
                                                                                event.checked
                                                                            )
                                                                        )
                                                                    }
                                                                />
                                                                {permissions.length >
                                                                    1 && (
                                                                    <span
                                                                        className={
                                                                            styles.permissionCount
                                                                        }
                                                                        title={
                                                                            permissionUrls
                                                                        }
                                                                    >
                                                                        {
                                                                            selectedCount
                                                                        }
                                                                        /
                                                                        {
                                                                            permissions.length
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <label
                                                                htmlFor={inputId}
                                                                className={
                                                                    styles.srOnly
                                                                }
                                                            >
                                                                {groupLabel}
                                                            </label>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </AccordionTab>
                    );
                })}
            </Accordion>
        </div>
    );
}

