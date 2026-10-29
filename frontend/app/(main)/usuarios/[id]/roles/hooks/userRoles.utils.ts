import {
    PermissionItem,
    PermissionModule,
    PermissionOperation,
    RoleSummary
} from '@/types/security';

const OPERATION_ORDER: PermissionOperation[] = [
    'VER',
    'LISTAR',
    'CREAR',
    'ACTUALIZAR',
    'ELIMINAR'
];

export function sortRolesByName(roles: RoleSummary[]): RoleSummary[] {
    return [...roles].sort((first, second) =>
        first.name.localeCompare(second.name)
    );
}

export function computeAvailableRoles(
    allRoles: RoleSummary[],
    assignedRoles: RoleSummary[]
): RoleSummary[] {
    const assignedIds = new Set(assignedRoles.map((role) => role.id));

    return allRoles.filter((role) => !assignedIds.has(role.id));
}

// Un permiso compartido por varios roles cuenta una sola vez.
export function mergeEffectivePermissions(
    permissionLists: PermissionItem[][]
): PermissionItem[] {
    const byId = new Map<number, PermissionItem>();

    permissionLists.forEach((permissions) =>
        permissions.forEach((permission) => {
            if (!byId.has(permission.id)) {
                byId.set(permission.id, permission);
            }
        })
    );

    return Array.from(byId.values());
}

export function groupPermissionsByModule(
    permissions: PermissionItem[]
): PermissionModule[] {
    const modules = new Map<string, Map<string, PermissionItem[]>>();

    permissions.forEach((permission) => {
        const resources =
            modules.get(permission.module) ??
            new Map<string, PermissionItem[]>();
        const items = resources.get(permission.resource) ?? [];

        items.push(permission);
        resources.set(permission.resource, items);
        modules.set(permission.module, resources);
    });

    return Array.from(modules.entries())
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([name, resources]) => ({
            name,
            resources: Array.from(resources.entries())
                .sort(([first], [second]) => first.localeCompare(second))
                .map(([resourceName, items]) => ({
                    name: resourceName,
                    permissions: [...items].sort(
                        (first, second) =>
                            OPERATION_ORDER.indexOf(first.operation) -
                            OPERATION_ORDER.indexOf(second.operation)
                    )
                }))
        }));
}
