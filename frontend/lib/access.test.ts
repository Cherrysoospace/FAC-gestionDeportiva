import { describe, expect, it } from 'vitest';
import {
    hasEndpointRequirement,
    hasPermissionRequirement,
    normalizeEndpointUrl,
    permissionMatchesEndpoint
} from './access';
import { PermissionItem } from '@/types/security';

function permission(
    id: number,
    url: string,
    method: string,
    resource: string,
    operation: PermissionItem['operation']
): PermissionItem {
    return {
        id,
        url,
        method,
        module: 'Administración',
        resource,
        operation,
        operationLabel: operation
    };
}

describe('normalizeEndpointUrl', () => {
    it('reemplaza ids numéricos por el marcador {id}', () => {
        expect(normalizeEndpointUrl('/api/roles/12/permissions')).toBe(
            '/api/roles/{id}/permissions'
        );
    });

    it('reemplaza ids hexadecimales de 24 caracteres', () => {
        expect(
            normalizeEndpointUrl('/api/users/507f1f77bcf86cd799439011/sessions')
        ).toBe('/api/users/{id}/sessions');
    });

    it('elimina la barra final sobrante', () => {
        expect(normalizeEndpointUrl('/api/roles/')).toBe('/api/roles');
    });

    it('no modifica segmentos que no son ids', () => {
        expect(normalizeEndpointUrl('/api/users/me')).toBe('/api/users/me');
    });
});

describe('permissionMatchesEndpoint', () => {
    it('compara método sin distinguir mayúsculas y URLs normalizadas', () => {
        const item = permission(
            1,
            '/api/roles/5/permissions',
            'put',
            'Roles',
            'ACTUALIZAR'
        );

        expect(
            permissionMatchesEndpoint(item, {
                url: '/api/roles/{id}/permissions',
                method: 'PUT'
            })
        ).toBe(true);
    });
});

describe('hasPermissionRequirement', () => {
    it('coincide por recurso y operación sin distinguir mayúsculas', () => {
        const item = permission(
            1,
            '/api/roles/5/summary',
            'GET',
            'roles',
            'VER'
        );

        expect(
            hasPermissionRequirement([item], {
                resource: 'Roles',
                operation: 'VER'
            })
        ).toBe(true);
    });

    it('devuelve false cuando no existe la combinación', () => {
        const item = permission(
            1,
            '/api/roles/5/summary',
            'GET',
            'Roles',
            'VER'
        );

        expect(
            hasPermissionRequirement([item], {
                resource: 'Roles',
                operation: 'ELIMINAR'
            })
        ).toBe(false);
    });
});

describe('hasEndpointRequirement', () => {
    it('requiere el endpoint y el método exactos', () => {
        const items = [
            permission(1, '/api/roles/{id}/permissions', 'GET', 'Roles', 'VER'),
            permission(
                2,
                '/api/roles/{id}/permissions',
                'PUT',
                'Roles',
                'ACTUALIZAR'
            )
        ];

        expect(
            hasEndpointRequirement(items, {
                url: '/api/roles/{id}/permissions',
                method: 'PUT'
            })
        ).toBe(true);
        expect(
            hasEndpointRequirement(items, {
                url: '/api/roles/{id}/permissions',
                method: 'DELETE'
            })
        ).toBe(false);
    });
});
