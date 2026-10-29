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

export const USER_DETAIL_ENDPOINTS: EndpointRequirement[] = [
    { url: '/api/users/{id}', method: 'GET' },
    { url: '/api/users/{id}/profile', method: 'GET' }
];

export const USER_CREATE_ENDPOINT: EndpointRequirement = { url: '/api/users', method: 'POST' };

export const USER_UPDATE_ENDPOINT: EndpointRequirement = { url: '/api/users/{id}', method: 'PUT' };

export const USER_DEACTIVATE_ENDPOINT: EndpointRequirement = { url: '/api/users/{id}', method: 'DELETE' };

export const USER_REACTIVATE_ENDPOINT: EndpointRequirement = { url: '/api/users/{id}/status', method: 'PATCH' };

export const USER_PROFILE_EDIT_ENDPOINTS: EndpointRequirement[] = [
    { url: '/api/users/{id}/profile', method: 'POST' },
    { url: '/api/users/{id}/profile', method: 'PUT' }
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
