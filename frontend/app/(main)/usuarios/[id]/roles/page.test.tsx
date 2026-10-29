import { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleSummary } from '@/types/security';
import UserRolesPage from './page';

const CONSULTOR: RoleSummary = {
    id: 2,
    name: 'CONSULTOR',
    description: 'Consulta de usuarios',
    active: true
};

const dialog = vi.hoisted(() => ({ confirmDialog: vi.fn() }));
const hook = vi.hoisted(() => ({
    assign: vi.fn(),
    remove: vi.fn()
}));

vi.mock('primereact/confirmdialog', () => ({
    ConfirmDialog: () => null,
    confirmDialog: dialog.confirmDialog
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() })
}));

vi.mock('@/layout/ProtectedRoute', () => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>
}));

vi.mock('@/layout/context/authcontext', () => ({
    useAuth: () => ({
        user: { id: 1 },
        hasPermissionUrl: () => true,
        refreshPermissions: vi.fn()
    })
}));

vi.mock('./hooks/useUserRoles', () => ({
    useUserRoles: () => ({
        user: { id: 5, name: 'Ana Pérez', email: 'ana@uc.edu.co' },
        assignedRoles: [CONSULTOR],
        availableRoles: [],
        effectivePermissions: [],
        effectiveModules: [],
        pendingRoleIds: new Set(),
        initialLoading: false,
        permissionsLoading: false,
        loadError: null,
        permissionsError: null,
        assign: hook.assign,
        remove: hook.remove,
        reload: vi.fn()
    })
}));

describe('UserRolesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        hook.remove.mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        cleanup();
    });

    it('pide confirmación antes de retirar un rol', () => {
        render(<UserRolesPage params={{ id: '5' }} />);

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retirar el rol CONSULTOR de Ana Pérez'
            })
        );

        expect(dialog.confirmDialog).toHaveBeenCalledTimes(1);
        expect(hook.remove).not.toHaveBeenCalled();

        const options = dialog.confirmDialog.mock.calls[0][0];
        expect(options.header).toBe('Retirar rol');
        options.accept();

        expect(hook.remove).toHaveBeenCalledWith(CONSULTOR);
    });

    it('muestra un estado de error si el id de la ruta no es válido', () => {
        render(<UserRolesPage params={{ id: 'abc' }} />);

        expect(screen.getByText('Usuario no válido')).toBeTruthy();
    });
});
