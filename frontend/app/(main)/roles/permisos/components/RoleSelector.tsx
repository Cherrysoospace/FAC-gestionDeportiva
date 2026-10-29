'use client';

import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { RoleSummary } from '@/types/security';

interface RoleSelectorProps {
    roles: RoleSummary[];
    value: number | null;
    loading?: boolean;
    disabled?: boolean;
    onChange: (roleId: number) => void;
}

export default function RoleSelector({
    roles,
    value,
    loading = false,
    disabled = false,
    onChange
}: RoleSelectorProps) {
    return (
        <div className="flex flex-column gap-2">
            <label
                htmlFor="role-selector"
                className="text-900 font-medium"
            >
                Rol seleccionado
            </label>
            <Dropdown
                inputId="role-selector"
                value={value}
                options={roles}
                optionLabel="name"
                optionValue="id"
                filter
                filterBy="name"
                placeholder="Selecciona un rol"
                emptyMessage="No hay roles disponibles"
                className="w-full"
                disabled={disabled || loading}
                onChange={(event) => {
                    if (event.value !== null && event.value !== undefined) {
                        onChange(event.value);
                    }
                }}
                itemTemplate={(role: RoleSummary) => (
                    <div className="flex align-items-center justify-content-between gap-2">
                        <span className="flex align-items-center gap-2">
                            {role.id === value && (
                                <i className="pi pi-check text-primary text-xs" />
                            )}
                            <span>{role.name}</span>
                        </span>
                        <Tag
                            value={role.active ? 'Activo' : 'Inactivo'}
                            severity={role.active ? 'success' : 'danger'}
                            className="text-xs"
                        />
                    </div>
                )}
                valueTemplate={(role: RoleSummary | null) =>
                    role ? (
                        <span className="flex align-items-center gap-2">
                            <span>{role.name}</span>
                            {!role.active && (
                                <Tag
                                    value="Inactivo"
                                    severity="danger"
                                    className="text-xs"
                                />
                            )}
                        </span>
                    ) : (
                        <span className="text-600">Selecciona un rol</span>
                    )
                }
            />
            {loading && (
                <small className="text-600 flex align-items-center gap-1">
                    <i className="pi pi-spin pi-spinner text-xs" />
                    Cargando permisos del rol…
                </small>
            )}
        </div>
    );
}
