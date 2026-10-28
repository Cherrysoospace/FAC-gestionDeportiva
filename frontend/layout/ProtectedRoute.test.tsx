import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionOperation } from '@/types/security';
import ProtectedRoute from './ProtectedRoute';

vi.mock('primereact/button', () => ({
    Button: ({ label }: { label?: string }) => (
        <button type="button">{label}</button>
    )
}));

vi.mock('primereact/message', () => ({
    Message: ({ text }: { text?: string }) => <div>{text}</div>
}));

const navigation = vi.hoisted(() => ({
    push: vi.fn(),
    replace: vi.fn()
}));

vi.mock('next/navigation', () => ({
    useRouter: () => navigation,
    usePathname: () => '/roles/permisos'
}));

const auth = vi.hoisted(() => ({
    isAuthenticated: false,
    isLoading: false,
    user: null as Record<string, unknown> | null,
    permissionsStatus: 'idle' as
        | 'idle'
        | 'loading'
        | 'ready'
        | 'error',
    hasPermission: vi.fn(),
    hasPermissionUrl: vi.fn(),
    refreshPermissions: vi.fn()
}));

vi.mock('@/layout/context/authcontext', () => ({
    useAuth: () => auth
}));

const requiredPermissions = [
    {
        resource: 'Roles',
        operation: 'ACTUALIZAR' as PermissionOperation
    }
];

function renderProtectedRoute() {
    return render(
        <ProtectedRoute requiredPermissions={requiredPermissions}>
            <div>Contenido protegido</div>
        </ProtectedRoute>
    );
}

describe('ProtectedRoute', () => {
    afterEach(cleanup);

    beforeEach(() => {
        navigation.push.mockReset();
        navigation.replace.mockReset();
        auth.isAuthenticated = false;
        auth.isLoading = false;
        auth.user = null;
        auth.permissionsStatus = 'idle';
        auth.hasPermission.mockReset();
        auth.hasPermissionUrl.mockReset();
        auth.refreshPermissions.mockReset();
    });

    it('redirige al login guardando la ruta de destino', async () => {
        renderProtectedRoute();

        await waitFor(() => {
            expect(navigation.replace).toHaveBeenCalledWith(
                '/auth/login?next=%2Froles%2Fpermisos'
            );
        });
        expect(screen.queryByText('Contenido protegido')).toBeNull();
    });

    it('muestra acceso denegado cuando falta el permiso', () => {
        auth.isAuthenticated = true;
        auth.permissionsStatus = 'ready';
        auth.hasPermission.mockReturnValue(false);
        auth.hasPermissionUrl.mockReturnValue(true);

        renderProtectedRoute();

        expect(screen.getByText('Acceso denegado')).toBeTruthy();
        expect(screen.queryByText('Contenido protegido')).toBeNull();
        expect(navigation.replace).not.toHaveBeenCalled();
    });

    it('muestra el contenido cuando el usuario tiene el permiso', () => {
        auth.isAuthenticated = true;
        auth.permissionsStatus = 'ready';
        auth.hasPermission.mockReturnValue(true);
        auth.hasPermissionUrl.mockReturnValue(true);

        renderProtectedRoute();

        expect(screen.getByText('Contenido protegido')).toBeTruthy();
        expect(screen.queryByText('Acceso denegado')).toBeNull();
    });

    it('mantiene el contenido durante un refresco de permisos', () => {
        auth.isAuthenticated = true;
        auth.user = { id: 1 };
        auth.permissionsStatus = 'loading';
        auth.hasPermission.mockReturnValue(true);
        auth.hasPermissionUrl.mockReturnValue(true);

        renderProtectedRoute();

        expect(screen.getByText('Contenido protegido')).toBeTruthy();
        expect(navigation.replace).not.toHaveBeenCalled();
    });

    it('no redirige mientras se restauran la sesión y los permisos', () => {
        auth.isLoading = true;
        auth.isAuthenticated = false;

        renderProtectedRoute();

        expect(navigation.replace).not.toHaveBeenCalled();
        expect(screen.queryByText('Contenido protegido')).toBeNull();
    });
});
