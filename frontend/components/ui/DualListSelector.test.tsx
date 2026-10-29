import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DualListSelector, { DualListLabels } from './DualListSelector';

interface Item {
    id: number;
    name: string;
}

const LABELS: DualListLabels = {
    assignedTitle: 'Asignados',
    availableTitle: 'Disponibles',
    assignAction: 'Asignar',
    removeAction: 'Retirar',
    emptyAssigned: 'Sin elementos asignados',
    emptyAvailable: 'Sin elementos disponibles'
};

const getKey = (item: Item) => item.id;
const getText = (item: Item) => item.name;
const renderItem = (item: Item) => <span>{item.name}</span>;
const ariaLabel = (item: Item, action: 'assign' | 'remove') =>
    `${action === 'assign' ? 'Asignar' : 'Retirar'} ${item.name}`;

describe('DualListSelector', () => {
    afterEach(() => {
        cleanup();
    });

    it('muestra cada elemento solo en su panel con la acción correspondiente', () => {
        const onAssign = vi.fn();
        const onRemove = vi.fn();

        render(
            <DualListSelector
                assigned={[{ id: 1, name: 'ADMIN' }]}
                available={[{ id: 2, name: 'CONSULTOR' }]}
                getKey={getKey}
                getSearchText={getText}
                renderItem={renderItem}
                labels={LABELS}
                onAssign={onAssign}
                onRemove={onRemove}
                getActionAriaLabel={ariaLabel}
            />
        );

        expect(screen.queryByRole('button', { name: 'Asignar ADMIN' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Asignar CONSULTOR' }));
        fireEvent.click(screen.getByRole('button', { name: 'Retirar ADMIN' }));

        expect(onAssign).toHaveBeenCalledWith({ id: 2, name: 'CONSULTOR' });
        expect(onRemove).toHaveBeenCalledWith({ id: 1, name: 'ADMIN' });
    });

    it('deshabilita la acción de un elemento con petición en curso', () => {
        const onAssign = vi.fn();

        render(
            <DualListSelector
                assigned={[]}
                available={[{ id: 2, name: 'CONSULTOR' }]}
                getKey={getKey}
                getSearchText={getText}
                renderItem={renderItem}
                labels={LABELS}
                onAssign={onAssign}
                getActionAriaLabel={ariaLabel}
                pendingKeys={new Set([2])}
            />
        );

        const button = screen.getByRole('button', { name: 'Asignar CONSULTOR' });
        expect((button as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(button);
        expect(onAssign).not.toHaveBeenCalled();
    });

    it('muestra el estado vacío y oculta acciones sin callback', () => {
        render(
            <DualListSelector
                assigned={[]}
                available={[{ id: 2, name: 'CONSULTOR' }]}
                getKey={getKey}
                getSearchText={getText}
                renderItem={renderItem}
                labels={LABELS}
            />
        );

        expect(screen.getByText('Sin elementos asignados')).toBeTruthy();
        expect(screen.queryByRole('button', { name: /Asignar/ })).toBeNull();
    });
});
