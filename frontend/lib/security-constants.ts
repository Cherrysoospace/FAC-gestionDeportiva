import { EndpointRequirement, PermissionRequirement } from '@/types/security';

export const ROLE_PERMISSIONS_VIEW_REQUIREMENT: PermissionRequirement = {
    resource: 'Roles',
    operation: 'ACTUALIZAR'
};

export const ROLE_PERMISSIONS_VIEW_ENDPOINTS: EndpointRequirement[] = [
    { url: '/api/roles', method: 'GET' },
    { url: '/api/permissions/catalog', method: 'GET' },
    { url: '/api/roles/{id}/permissions', method: 'GET' },
    { url: '/api/roles/{id}/summary', method: 'GET' },
    { url: '/api/roles/{id}/permissions', method: 'PUT' }
];
