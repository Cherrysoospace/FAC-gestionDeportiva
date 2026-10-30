'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
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

const RESOURCE_ICONS: Record<string, string> = {
    Usuarios: 'pi-users',
    Roles: 'pi-user',
    Permisos: 'pi-key',
    'Asignación de roles': 'pi-id-card',
    'Asignación de permisos': 'pi-lock',
    Torneos: 'pi-trophy',
    Equipos: 'pi-users',
    Jugadores: 'pi-user',
    Partidos: 'pi-globe',
    Entradas: 'pi-ticket',
    Escenarios: 'pi-building',
    Reportes: 'pi-chart-bar',
    Perfiles: 'pi-id-card',
    Sesiones: 'pi-desktop',
    Autenticación: 'pi-shield'
};

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

function filterModules(
    modules: PermissionModule[],
    query: string
): PermissionModule[] {
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
    const [collapsedModules, setCollapsedModules] = useState<Set<string>>(
        () => new Set()
    );
    const [query, setQuery] = useState('');

    const visibleModules = useMemo(
        () => filterModules(catalog?.modules ?? [], query),
        [catalog, query]
    );

    useEffect(() => {
        setCollapsedModules(new Set());
    }, [catalog]);

    const toggleModuleCollapse = (moduleName: string) => {
        setCollapsedModules((previous) => {
            const next = new Set(previous);
            if (next.has(moduleName)) {
                next.delete(moduleName);
            } else {
                next.add(moduleName);
            }
            return next;
        });
    };

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

    const isSearching = query.trim().length > 0;

    return (
        <div className="card">
            <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-3">
                <h5 className="m-0">Matriz de permisos del rol</h5>
                <SearchInput
                    value={query}
                    onChange={setQuery}
                    ariaLabel="Buscar permisos por recurso o módulo"
                    placeholder="Buscar recurso o módulo..."
                />
            </div>

            {selectedIds.size === 0 && (
                <Message
                    severity="info"
                    className="w-full mb-3"
                    text="Este rol no tiene permisos asignados actualmente."
                />
            )}

            {visibleModules.length === 0 ? (
                <EmptyState
                    icon="pi-search"
                    title="Ningún recurso coincide con la búsqueda."
                    description="Prueba con otro nombre o borra el texto para ver todos los permisos."
                />
            ) : (
                <div className={styles.matrixWrapper}>
                    <table className={styles.matrixTable}>
                        <thead>
                            <tr>
                                <th scope="col">Recurso</th>
                                {OPERATIONS.map((operation) => (
                                    <th key={operation.key} scope="col">
                                        {operation.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleModules.map((permissionModule) => {
                                const moduleIds =
                                    modulePermissionIds(permissionModule);
                                const assignedInModule = moduleIds.filter(
                                    (id) => selectedIds.has(id)
                                ).length;
                                const allModuleSelected =
                                    moduleIds.length > 0 &&
                                    assignedInModule === moduleIds.length;
                                const isCollapsed =
                                    !isSearching &&
                                    collapsedModules.has(permissionModule.name);

                                return (
                                    <Fragment key={permissionModule.name}>
                                        <tr className={styles.moduleGroupRow}>
                                            <td colSpan={OPERATIONS.length + 1}>
                                                <div className="flex align-items-center justify-content-between gap-3">
                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.moduleToggleBtn
                                                        }
                                                        onClick={() =>
                                                            toggleModuleCollapse(
                                                                permissionModule.name
                                                            )
                                                        }
                                                        aria-expanded={
                                                            !isCollapsed
                                                        }
                                                    >
                                                        <i
                                                            className={`pi ${
                                                                isCollapsed
                                                                    ? 'pi-chevron-right'
                                                                    : 'pi-chevron-down'
                                                            } text-xs`}
                                                            aria-hidden="true"
                                                        />
                                                        <span>
                                                            {
                                                                permissionModule.name
                                                            }
                                                        </span>
                                                    </button>
                                                    <div className="flex align-items-center gap-2">
                                                        <span className="text-600 text-xs font-normal">
                                                            {assignedInModule}/
                                                            {moduleIds.length}{' '}
                                                            asignados
                                                        </span>
                                                        <Checkbox
                                                            inputId={`module-check-${permissionModule.name}`}
                                                            inputRef={(
                                                                element
                                                            ) => {
                                                                if (element) {
                                                                    element.indeterminate =
                                                                        assignedInModule >
                                                                            0 &&
                                                                        !allModuleSelected;
                                                                }
                                                            }}
                                                            checked={
                                                                allModuleSelected
                                                            }
                                                            disabled={disabled}
                                                            aria-label={`Seleccionar todos los permisos de ${permissionModule.name}`}
                                                            onChange={(event) =>
                                                                onToggle(
                                                                    moduleIds,
                                                                    Boolean(
                                                                        event.checked
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>

                                        {!isCollapsed &&
                                            permissionModule.resources.map(
                                                (resource) => {
                                                    const iconClass =
                                                        RESOURCE_ICONS[
                                                            resource.name
                                                        ] ?? 'pi-folder';

                                                    return (
                                                        <tr
                                                            key={`${permissionModule.name}-${resource.name}`}
                                                            className={
                                                                styles.resourceRow
                                                            }
                                                        >
                                                            <td
                                                                role="rowheader"
                                                                className={
                                                                    styles.resourceName
                                                                }
                                                            >
                                                                <span className="flex align-items-center gap-2">
                                                                    <i
                                                                        className={`pi ${iconClass} text-600`}
                                                                        aria-hidden="true"
                                                                    />
                                                                    <span>
                                                                        {
                                                                            resource.name
                                                                        }
                                                                    </span>
                                                                </span>
                                                            </td>
                                                            {OPERATIONS.map(
                                                                (operation) => {
                                                                    const permissions =
                                                                        permissionsForOperation(
                                                                            resource,
                                                                            operation.key
                                                                        );

                                                                    if (
                                                                        permissions.length ===
                                                                        0
                                                                    ) {
                                                                        return (
                                                                            <td
                                                                                key={
                                                                                    operation.key
                                                                                }
                                                                                className={
                                                                                    styles.checkboxCell
                                                                                }
                                                                            >
                                                                                <Checkbox
                                                                                    checked={
                                                                                        false
                                                                                    }
                                                                                    disabled
                                                                                    aria-label={`${operation.label} ${resource.name} (no disponible)`}
                                                                                />
                                                                            </td>
                                                                        );
                                                                    }

                                                                    const selectedCount =
                                                                        permissions.filter(
                                                                            (
                                                                                permission
                                                                            ) =>
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
                                                                                (
                                                                                    permission
                                                                                ) =>
                                                                                    `${permission.method} ${permission.url}`
                                                                            )
                                                                            .join(
                                                                                '\n'
                                                                            );

                                                                    return (
                                                                        <td
                                                                            key={
                                                                                operation.key
                                                                            }
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
                                                                                htmlFor={
                                                                                    inputId
                                                                                }
                                                                                className={
                                                                                    styles.srOnly
                                                                                }
                                                                            >
                                                                                {
                                                                                    groupLabel
                                                                                }
                                                                            </label>
                                                                        </td>
                                                                    );
                                                                }
                                                            )}
                                                        </tr>
                                                    );
                                                }
                                            )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
