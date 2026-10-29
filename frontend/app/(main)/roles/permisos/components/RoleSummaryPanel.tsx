'use client';

import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import StatCard from '@/components/ui/StatCard';
import { RoleAccessSummary, RoleSummary } from '@/types/security';
import styles from '../permissions.module.scss';

interface RoleSummaryPanelProps {
    role: RoleSummary | null;
    summary: RoleAccessSummary | null;
    assignedCount: number;
    totalAvailable: number;
    notAssigned: number;
    modules: string[];
    dirty: boolean;
    loading?: boolean;
    saving?: boolean;
    onSave: () => void;
}

export default function RoleSummaryPanel({
    role,
    summary,
    assignedCount,
    totalAvailable,
    notAssigned,
    modules,
    dirty,
    loading = false,
    saving = false,
    onSave
}: RoleSummaryPanelProps) {
    const percentage =
        totalAvailable > 0
            ? Math.round((assignedCount / totalAvailable) * 100)
            : 0;

    return (
        <div className="card h-full">
            <div className="flex align-items-center justify-content-between gap-2 mb-3">
                <h5 className="m-0">Resumen del rol</h5>
                {loading && (
                    <i className="pi pi-spin pi-spinner text-600 text-sm" />
                )}
            </div>

            {role ? (
                <div className="flex flex-column gap-2 mb-4">
                    <div className="flex align-items-center gap-2 flex-wrap">
                        <span className="text-900 font-medium">
                            {role.name}
                        </span>
                        <Tag
                            value={role.active ? 'Activo' : 'Inactivo'}
                            severity={role.active ? 'success' : 'danger'}
                        />
                        {dirty && (
                            <Tag
                                value="Cambios sin guardar"
                                severity="warning"
                            />
                        )}
                    </div>
                    {role.description && (
                        <span className="text-600 text-sm line-height-3">
                            {role.description}
                        </span>
                    )}
                </div>
            ) : (
                <div className="text-600 text-sm mb-4">
                    Selecciona un rol para ver su resumen.
                </div>
            )}

            <div className="flex align-items-center justify-content-between mb-2">
                <span className="text-600 text-sm">Cobertura de permisos</span>
                <span className="text-900 font-medium">{percentage}%</span>
            </div>
            <ProgressBar
                value={percentage}
                showValue={false}
                className={`mb-4 ${styles.coverageBar}`}
            />

            <div className="grid grid-nogutter mb-3">
                <div className="col-6 p-1">
                    <StatCard label="Total disponibles" value={totalAvailable} />
                </div>
                <div className="col-6 p-1">
                    <StatCard label="Asignados" value={assignedCount} />
                </div>
                <div className="col-6 p-1">
                    <StatCard label="No asignados" value={notAssigned} />
                </div>
                <div className="col-6 p-1">
                    <StatCard
                        label="Usuarios asociados"
                        value={summary?.usersCount ?? 0}
                    />
                </div>
            </div>

            <div className="flex flex-column gap-2 mb-4">
                <span className="text-600 text-sm">Módulos con acceso</span>
                <div className="flex flex-wrap gap-1">
                    {modules.length > 0 ? (
                        modules.map((moduleName) => (
                            <Tag
                                key={moduleName}
                                value={moduleName}
                                severity="info"
                                className="text-xs"
                            />
                        ))
                    ) : (
                        <span className="text-600 text-sm">
                            Sin módulos habilitados
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-column gap-2 mb-4">
                <span className="text-600 text-sm">Leyenda</span>
                <div className="flex flex-wrap gap-3">
                    <span className="flex align-items-center gap-2 text-sm text-600">
                        <span className={styles.legendAssigned} />
                        Permiso asignado
                    </span>
                    <span className="flex align-items-center gap-2 text-sm text-600">
                        <span className={styles.legendUnassigned} />
                        Permiso no asignado
                    </span>
                </div>
            </div>

            <div className="flex flex-column gap-2 mb-4">
                <span className="text-600 text-sm">Reglas de acceso</span>
                <ul className="m-0 pl-3 text-600 text-sm line-height-3">
                    <li>
                        Si al menos uno de los roles del usuario posee el
                        permiso, la operación se permite.
                    </li>
                    <li>
                        Si ninguno de sus roles posee el permiso, la operación
                        se deniega.
                    </li>
                    <li>
                        Los cambios aplican a todos los usuarios que tengan
                        este rol.
                    </li>
                </ul>
            </div>

            <Message
                severity="warn"
                className="w-full"
                text="Retirar un permiso del rol no elimina el permiso del sistema."
            />

            <span className="text-600 text-xs mt-3 line-height-3">
                Los totales de permisos y módulos incluyen los cambios locales
                aún no guardados.
            </span>

            <Button
                label="Guardar cambios"
                icon="pi pi-check"
                className="w-full mt-4"
                loading={saving}
                disabled={!dirty || !role || saving || loading}
                onClick={onSave}
            />
        </div>
    );
}
