import { describe, expect, it } from 'vitest';
import { PermissionItem, RoleSummary } from '@/types/security';
import {
    computeAvailableRoles,
    groupPermissionsByModule,
    mergeEffectivePermissions
} from './userRoles.utils';

function role(id: number, name: string): RoleSummary {
    return { id, name, description: `Rol ${name}`, active: true };
}

function permission(
    id: number,
    module: string,
    resource: string,
    operation: PermissionItem['operation']
): PermissionItem {
    return {
        id,
        url: `/api/${resource.toLowerCase()}`,
        method: 'GET',
        module,
        resource,
        operation,
        operationLabel: operation
    };
}

describe('computeAvailableRoles', () => {
    it('excluye los roles ya asignados', () => {
        const all = [role(1, 'ADMIN'), role(2, 'CONSULTOR'), role(3, 'AFICIONADO')];

        const available = computeAvailableRoles(all, [role(2, 'CONSULTOR')]);

        expect(available.map((item) => item.id)).toEqual([1, 3]);
    });

    it('devuelve una lista vacía cuando el usuario tiene todos los roles', () => {
        const all = [role(1, 'ADMIN'), role(2, 'CONSULTOR')];

        expect(computeAvailableRoles(all, all)).toEqual([]);
    });
});

describe('mergeEffectivePermissions', () => {
    it('une los permisos de varios roles sin duplicados', () => {
        const shared = permission(1, 'Administración', 'Usuarios', 'VER');
        const merged = mergeEffectivePermissions([
            [shared, permission(2, 'Administración', 'Roles', 'LISTAR')],
            [shared, permission(3, 'Reportes', 'Reportes', 'VER')]
        ]);

        expect(merged.map((item) => item.id).sort()).toEqual([1, 2, 3]);
    });

    it('devuelve vacío si no hay roles', () => {
        expect(mergeEffectivePermissions([])).toEqual([]);
    });
});

describe('groupPermissionsByModule', () => {
    it('agrupa por módulo y recurso, ordenando operaciones', () => {
        const groups = groupPermissionsByModule([
            permission(1, 'Reportes', 'Reportes', 'VER'),
            permission(2, 'Administración', 'Usuarios', 'ELIMINAR'),
            permission(3, 'Administración', 'Usuarios', 'VER'),
            permission(4, 'Administración', 'Roles', 'LISTAR')
        ]);

        expect(groups.map((group) => group.name)).toEqual([
            'Administración',
            'Reportes'
        ]);
        expect(groups[0].resources.map((resource) => resource.name)).toEqual([
            'Roles',
            'Usuarios'
        ]);
        expect(
            groups[0].resources[1].permissions.map((item) => item.operation)
        ).toEqual(['VER', 'ELIMINAR']);
    });
});
