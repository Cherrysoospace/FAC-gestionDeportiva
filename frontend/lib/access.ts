import {
    EndpointRequirement,
    PermissionItem,
    PermissionRequirement
} from '@/types/security';

export function normalizeEndpointUrl(url: string): string {
    const normalized = url.replace(/(^|\/)(?:\d+|[a-f0-9]{24})(?=\/|$)/gi, '$1{id}');

    if (normalized.length > 1 && normalized.endsWith('/')) {
        return normalized.slice(0, -1);
    }

    return normalized;
}

export function permissionMatchesEndpoint(
    permission: PermissionItem,
    requirement: EndpointRequirement
): boolean {
    return (
        permission.method.toUpperCase() === requirement.method.toUpperCase() &&
        normalizeEndpointUrl(permission.url) ===
            normalizeEndpointUrl(requirement.url)
    );
}

export function hasPermissionRequirement(
    permissions: PermissionItem[],
    requirement: PermissionRequirement
): boolean {
    const resource = requirement.resource.trim().toLowerCase();
    const operation = requirement.operation.trim().toUpperCase();

    return permissions.some(
        (permission) =>
            permission.resource.trim().toLowerCase() === resource &&
            permission.operation.toUpperCase() === operation
    );
}

export function hasEndpointRequirement(
    permissions: PermissionItem[],
    requirement: EndpointRequirement
): boolean {
    return permissions.some((permission) =>
        permissionMatchesEndpoint(permission, requirement)
    );
}
