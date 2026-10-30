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
                className="text-700 text-sm font-medium"
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
                    <div className="flex align-items-center justify-content-between gap-2 w-full">
                        <span className="flex align-items-center gap-2">
                            <i
                                className={`pi pi-user ${
                                    role.id === value
                                        ? 'text-primary'
                                        : 'text-600'
                                }`}
                                aria-hidden="true"
                            />
                            <span
                                className={
                                    role.id === value
                                        ? 'font-semibold text-primary'
                                        : 'text-900'
                                }
                            >
                                {role.name}
                            </span>
                            {!role.active && (
                                <Tag
                                    value="Inactivo"
                                    severity="danger"
                                    className="text-xs"
                                />
                            )}
                        </span>
                        {role.id === value && (
                            <i
                                className="pi pi-check text-primary text-sm"
                                aria-hidden="true"
                            />
                        )}
                    </div>
                )}
                valueTemplate={(role: RoleSummary | null) =>
                    role ? (
                        <span className="flex align-items-center gap-2">
                            <i
                                className="pi pi-user text-primary"
                                aria-hidden="true"
                            />
                            <span className="font-medium text-900">
                                {role.name}
                            </span>
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
