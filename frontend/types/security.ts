export type PermissionOperation =
    | 'VER'
    | 'LISTAR'
    | 'CREAR'
    | 'ACTUALIZAR'
    | 'ELIMINAR';

export interface PermissionItem {
    id: number;
    url: string;
    method: string;
    module: string;
    resource: string;
    operation: PermissionOperation;
    operationLabel: string;
}

export interface PermissionResource {
    name: string;
    permissions: PermissionItem[];
}

export interface PermissionModule {
    name: string;
    resources: PermissionResource[];
}

export interface PermissionCatalog {
    modules: PermissionModule[];
    total: number;
}

export interface RoleSummary {
    id: number;
    name: string;
    description: string;
    active: boolean;
}

export interface RolePermissionsAssignment {
    roleId: number;
    roleName: string;
    roleDescription: string;
    roleActive: boolean;
    permissionIds: number[];
    permissions: PermissionItem[];
    totalAssigned: number;
    totalAvailable: number;
}

export interface RoleAccessSummary {
    roleId: number;
    roleName: string;
    roleDescription: string;
    roleActive: boolean;
    usersCount: number;
    assignedCount: number;
    modulesWithAccess: string[];
    totalAvailable: number;
    notAssigned: number;
}

export interface CurrentUser {
    id: number;
    name: string;
    email: string;
    roles: RoleSummary[];
    permissions: PermissionItem[];
}

export interface PermissionRequirement {
    resource: string;
    operation: PermissionOperation;
}

export interface EndpointRequirement {
    url: string;
    method: string;
}

export interface UserSummary {
    id: number;
    name: string;
    email: string;
}

export interface UserRoleAssignment {
    id: number;
    userId: number;
    role: RoleSummary;
}

export interface UserWithRoles extends UserSummary {
    roles: UserRoleAssignment[];
}
