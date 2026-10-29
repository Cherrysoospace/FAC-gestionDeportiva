'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuth } from '@/layout/context/authcontext';
import {
    EndpointRequirement,
    PermissionRequirement
} from '@/types/security';
import LoadingState from '@/components/ui/LoadingState';
import AccessDenied from './AccessDenied';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredPermissions?: PermissionRequirement[];
    requiredEndpoints?: EndpointRequirement[];
}

export default function ProtectedRoute({
    children,
    requiredPermissions = [],
    requiredEndpoints = []
}: ProtectedRouteProps) {
    const router = useRouter();
    const pathname = usePathname();
    const {
        isAuthenticated,
        isLoading,
        user,
        permissionsStatus,
        hasPermission,
        hasPermissionUrl,
        refreshPermissions
    } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            const next = encodeURIComponent(pathname || '/');
            router.replace(`/auth/login?next=${next}`);
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    if (
        isLoading ||
        (isAuthenticated && permissionsStatus === 'loading' && !user)
    ) {
        return <LoadingState message="Cargando tus permisos…" />;
    }

    if (!isAuthenticated) {
        return null;
    }

    if (permissionsStatus === 'error' && !user) {
        return (
            <div className="card flex flex-column align-items-center gap-3 py-6">
                <Message
                    severity="error"
                    text="No se pudieron cargar tus permisos. Revisa la conexión e inténtalo de nuevo."
                    className="w-full"
                />
                <Button
                    label="Reintentar"
                    icon="pi pi-refresh"
                    onClick={() => void refreshPermissions()}
                />
            </div>
        );
    }

    const allowedByResource = requiredPermissions.every((requirement) =>
        hasPermission(requirement.resource, requirement.operation)
    );

    const allowedByEndpoint = requiredEndpoints.every((requirement) =>
        hasPermissionUrl(requirement.url, requirement.method)
    );

    if (!allowedByResource || !allowedByEndpoint) {
        return <AccessDenied onRetry={() => void refreshPermissions()} />;
    }

    return <>{children}</>;
}
