import { EndpointRequirement } from '@/types/security';
import { ROLE_PERMISSIONS_VIEW_ENDPOINTS, USERS_VIEW_ENDPOINTS } from './security-constants';

export interface AppModule {
    label: string;
    description: string;
    icon: string;
    to: string;
    section: 'Seguridad' | 'Cuenta';
    /** Endpoints que el usuario debe tener todos para ver el módulo. Vacío = cualquier usuario autenticado. */
    requiredEndpoints: EndpointRequirement[];
}

export const APP_MODULES: AppModule[] = [
    {
        label: 'Usuarios',
        description: 'Registra, edita y desactiva usuarios, y gestiona sus roles.',
        icon: 'pi-users',
        to: '/usuarios',
        section: 'Seguridad',
        requiredEndpoints: USERS_VIEW_ENDPOINTS
    },
    {
        label: 'Asignar permisos',
        description: 'Define qué puede hacer cada rol dentro del sistema.',
        icon: 'pi-lock',
        to: '/roles/permisos',
        section: 'Seguridad',
        requiredEndpoints: ROLE_PERMISSIONS_VIEW_ENDPOINTS
    },
    {
        label: 'Mi perfil',
        description: 'Consulta y actualiza tus datos personales y tu foto.',
        icon: 'pi-user',
        to: '/perfil',
        section: 'Cuenta',
        requiredEndpoints: []
    }
];

export type PermissionChecker = (url: string, method: string) => boolean;

export function canAccessModule(module: AppModule, hasPermissionUrl: PermissionChecker): boolean {
    return module.requiredEndpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
}

export function getAllowedModules(hasPermissionUrl: PermissionChecker): AppModule[] {
    return APP_MODULES.filter((module) => canAccessModule(module, hasPermissionUrl));
}
