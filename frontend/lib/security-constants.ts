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

export const USERS_VIEW_ENDPOINTS: EndpointRequirement[] = [
    { url: '/api/users', method: 'GET' }
];

export const USER_ROLES_VIEW_ENDPOINTS: EndpointRequirement[] = [
    { url: '/api/users/{id}/detail-with-roles', method: 'GET' },
    { url: '/api/roles', method: 'GET' },
    { url: '/api/roles/{id}/permissions', method: 'GET' }
];

export const USER_ROLE_ASSIGN_ENDPOINT: EndpointRequirement = {
    url: '/api/user-roles',
    method: 'POST'
};

export const USER_ROLE_REMOVE_ENDPOINT: EndpointRequirement = {
    url: '/api/user-roles/{id}/{id}',
    method: 'DELETE'
};
