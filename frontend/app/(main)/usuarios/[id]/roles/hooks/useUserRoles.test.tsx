import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import { PermissionItem, RoleSummary } from '@/types/security';
import { useUserRoles } from './useUserRoles';

const api = vi.hoisted(() => ({
    fetchUserWithRoles: vi.fn(),
    fetchRoles: vi.fn(),
    fetchRolePermissions: vi.fn(),
    assignRoleToUser: vi.fn(),
    removeRoleFromUser: vi.fn()
}));

vi.mock('@/lib/user-api', () => ({
    fetchUserWithRoles: api.fetchUserWithRoles
}));

vi.mock('@/lib/security-api', () => ({
    fetchRoles: api.fetchRoles,
    fetchRolePermissions: api.fetchRolePermissions
}));

vi.mock('@/lib/user-role-api', () => ({
    assignRoleToUser: api.assignRoleToUser,
    removeRoleFromUser: api.removeRoleFromUser
}));

const ADMIN: RoleSummary = {
    id: 1,
    name: 'ADMIN',
    description: 'Administrador',
    active: true
};
const CONSULTOR: RoleSummary = {
    id: 2,
    name: 'CONSULTOR',
    description: 'Consulta de usuarios',
    active: true
};
const AFICIONADO: RoleSummary = {
    id: 3,
    name: 'AFICIONADO',
    description: 'Permisos mínimos',
    active: true
};

function permission(id: number, resource: string): PermissionItem {
    return {
        id,
        url: `/api/${resource.toLowerCase()}`,
        method: 'GET',
        module: 'Administración',
        resource,
        operation: 'VER',
        operationLabel: 'Ver'
    };
}

const PERMISSIONS_BY_ROLE: Record<number, PermissionItem[]> = {
    1: [permission(10, 'Usuarios'), permission(11, 'Roles')],
    2: [permission(10, 'Usuarios'), permission(12, 'Permisos')],
    3: []
};

async function renderLoaded() {
    const hook = renderHook(() => useUserRoles(5));

    await waitFor(() => {
        expect(hook.result.current.initialLoading).toBe(false);
        expect(hook.result.current.permissionsLoading).toBe(false);
    });

    return hook;
}

describe('useUserRoles', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.fetchUserWithRoles.mockResolvedValue({
            id: 5,
            name: 'Ana Pérez',
            email: 'ana@uc.edu.co',
            roles: [{ id: 100, userId: 5, role: ADMIN }]
        });
        api.fetchRoles.mockResolvedValue([ADMIN, CONSULTOR, AFICIONADO]);
        api.fetchRolePermissions.mockImplementation((roleId: number) =>
            Promise.resolve({ permissions: PERMISSIONS_BY_ROLE[roleId] })
        );
    });

    it('calcula los disponibles y los permisos efectivos al cargar', async () => {
        const { result } = await renderLoaded();

        expect(result.current.user?.name).toBe('Ana Pérez');
        expect(result.current.assignedRoles.map((role) => role.id)).toEqual([1]);
        expect(result.current.availableRoles.map((role) => role.id)).toEqual([
            3, 2
        ]);
        expect(result.current.effectivePermissions).toHaveLength(2);
    });

    it('al asignar mueve el rol y une sus permisos sin duplicados', async () => {
        api.assignRoleToUser.mockResolvedValue({
            id: 101,
            userId: 5,
            role: CONSULTOR
        });
        const { result } = await renderLoaded();

        let outcome;
        await act(async () => {
            outcome = await result.current.assign(CONSULTOR);
        });

        expect(outcome).toEqual({ ok: true });
        expect(api.assignRoleToUser).toHaveBeenCalledWith(5, 2);
        expect(result.current.availableRoles.map((role) => role.id)).toEqual([3]);
        await waitFor(() =>
            expect(result.current.effectivePermissions).toHaveLength(3)
        );
        expect(api.fetchRolePermissions).toHaveBeenCalledTimes(2);
    });

    it('no permite asignar un rol que el usuario ya tiene', async () => {
        const { result } = await renderLoaded();

        let outcome;
        await act(async () => {
            outcome = await result.current.assign(ADMIN);
        });

        expect(outcome).toEqual({
            ok: false,
            error: 'El usuario ya tiene asignado este rol.'
        });
        expect(api.assignRoleToUser).not.toHaveBeenCalled();
    });

    it('ignora un segundo clic mientras la asignación está en curso', async () => {
        let resolveAssign: (value: unknown) => void = () => undefined;
        api.assignRoleToUser.mockReturnValue(
            new Promise((resolve) => {
                resolveAssign = resolve;
            })
        );
        const { result } = await renderLoaded();

        let first: Promise<unknown> = Promise.resolve();
        let second: unknown;
        await act(async () => {
            first = result.current.assign(CONSULTOR);
            second = await result.current.assign(CONSULTOR);
        });

        expect(second).toEqual({
            ok: false,
            error: 'Ya hay una operación en curso para este rol.'
        });
        expect(result.current.pendingRoleIds.has(2)).toBe(true);

        await act(async () => {
            resolveAssign({ id: 101, userId: 5, role: CONSULTOR });
            await first;
        });

        expect(api.assignRoleToUser).toHaveBeenCalledTimes(1);
        expect(result.current.pendingRoleIds.size).toBe(0);
    });

    it('devuelve el mensaje del backend y no cambia el estado si falla', async () => {
        api.assignRoleToUser.mockRejectedValue(
            new ApiRequestError(400, 'INVALID_OPERATION', 'El rol está inactivo')
        );
        const { result } = await renderLoaded();

        let outcome;
        await act(async () => {
            outcome = await result.current.assign(CONSULTOR);
        });

        expect(outcome).toEqual({ ok: false, error: 'El rol está inactivo' });
        expect(result.current.assignedRoles.map((role) => role.id)).toEqual([1]);
    });

    it('al retirar recalcula disponibles y permisos efectivos', async () => {
        api.removeRoleFromUser.mockResolvedValue(undefined);
        const { result } = await renderLoaded();

        await act(async () => {
            await result.current.remove(ADMIN);
        });

        expect(api.removeRoleFromUser).toHaveBeenCalledWith(5, 1);
        expect(result.current.assignedRoles).toEqual([]);
        expect(result.current.availableRoles).toHaveLength(3);
        expect(result.current.effectivePermissions).toEqual([]);
    });
});
