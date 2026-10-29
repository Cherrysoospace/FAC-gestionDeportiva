'use client';

import { useMemo } from 'react';
import { useAuth } from '@/layout/context/authcontext';
import { getAllowedModules } from '@/lib/navigation';

function greetingFor(hour: number): string {
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

// Datos de la pantalla de inicio: saludo, roles del usuario y módulos a los que puede entrar.
export function useHomeSummary() {
    const { user, roles, permissionsStatus, hasPermissionUrl, refreshPermissions } = useAuth();

    const modules = useMemo(() => getAllowedModules(hasPermissionUrl), [hasPermissionUrl]);
    const activeRoles = useMemo(() => roles.filter((role) => role.active !== false), [roles]);

    return {
        greeting: greetingFor(new Date().getHours()),
        userName: user?.name ?? '',
        email: user?.email ?? '',
        roles: activeRoles,
        modules,
        loading: permissionsStatus === 'loading' || (!user && permissionsStatus !== 'error'),
        failed: permissionsStatus === 'error',
        retry: () => void refreshPermissions()
    };
}
