'use client';

import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
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
}

export default function RoleSummaryPanel({
    role,
    summary,
    assignedCount,
    totalAvailable,
    notAssigned,
    modules,
    dirty,
    loading = false
}: RoleSummaryPanelProps) {
    return (
        <div className="card h-full flex flex-column gap-3">
            <div className="flex align-items-center justify-content-between gap-2">
                <div className="flex align-items-center gap-2">
                    <i
                        className="pi pi-user text-primary text-lg"
                        aria-hidden="true"
                    />
                    <h5 className="m-0">Resumen del rol</h5>
                </div>
                {loading && (
                    <i className="pi pi-spin pi-spinner text-600 text-sm" />
                )}
            </div>

            {role ? (
                <div className="flex flex-column">
                    <div className={styles.summaryRow}>
                        <span className="text-600 text-sm">Nombre del rol:</span>
                        <span className="text-900 font-semibold">
                            {role.name}
                        </span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span className="text-600 text-sm">Estado:</span>
                        <div className="flex align-items-center gap-2">
                            <Tag
                                value={role.active ? '● Activo' : '● Inactivo'}
                                severity={role.active ? 'success' : 'danger'}
                            />
                            {dirty && (
                                <Tag
                                    value="Sin guardar"
                                    severity="warning"
                                />
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-600 text-sm">
                    Selecciona un rol para ver su resumen.
                </div>
            )}

            <div className="flex flex-column">
                <div className={styles.summaryRow}>
                    <span className="flex align-items-center gap-2 text-700 text-sm">
                        <i
                            className="pi pi-users text-primary"
                            aria-hidden="true"
                        />
                        <span>Usuarios asociados:</span>
                    </span>
                    <span className="text-900 font-semibold">
                        {summary?.usersCount ?? 0}
                    </span>
                </div>
                <div className={styles.summaryRow}>
                    <span className="flex align-items-center gap-2 text-700 text-sm">
                        <i
                            className="pi pi-key text-green-500"
                            aria-hidden="true"
                        />
                        <span>Total permisos asignados:</span>
                    </span>
                    <span className="text-900 font-semibold">
                        {assignedCount}
                    </span>
                </div>
                <div className={styles.summaryRow}>
                    <span className="flex align-items-center gap-2 text-700 text-sm">
                        <i
                            className="pi pi-box text-cyan-500"
                            aria-hidden="true"
                        />
                        <span>Módulos con acceso:</span>
                    </span>
                    <span className="text-900 font-semibold">
                        {modules.length}
                    </span>
                </div>
            </div>

            <div className={styles.kpiGrid}>
                <div className={styles.kpiBox}>
                    <i
                        className="pi pi-shield text-primary text-xl"
                        aria-hidden="true"
                    />
                    <span className="text-600 text-xs">
                        Total permisos disponibles
                    </span>
                    <span className={`${styles.kpiValue} text-primary`}>
                        {totalAvailable}
                    </span>
                </div>
                <div className={styles.kpiBox}>
                    <i
                        className="pi pi-check-circle text-green-500 text-xl"
                        aria-hidden="true"
                    />
                    <span className="text-600 text-xs">Asignados</span>
                    <span className={`${styles.kpiValue} text-green-500`}>
                        {assignedCount}
                    </span>
                </div>
                <div className={styles.kpiBox}>
                    <i
                        className="pi pi-times-circle text-600 text-xl"
                        aria-hidden="true"
                    />
                    <span className="text-600 text-xs">No asignados</span>
                    <span className={`${styles.kpiValue} text-900`}>
                        {notAssigned}
                    </span>
                </div>
            </div>

            <div className={styles.infoBox}>
                <div className="text-900 font-semibold text-sm mb-2">
                    Leyenda
                </div>
                <div className="flex flex-column gap-2">
                    <span className="flex align-items-center gap-2 text-sm text-700">
                        <Checkbox checked readOnly aria-hidden="true" />
                        <span>Permiso asignado</span>
                    </span>
                    <span className="flex align-items-center gap-2 text-sm text-700">
                        <Checkbox checked={false} readOnly aria-hidden="true" />
                        <span>Permiso no asignado</span>
                    </span>
                </div>
            </div>

            <div className={styles.infoBox}>
                <div className="flex align-items-center gap-2 text-900 font-semibold text-sm mb-2">
                    <i
                        className="pi pi-sliders-h text-primary"
                        aria-hidden="true"
                    />
                    <span>Reglas de acceso</span>
                </div>
                <ul className="m-0 pl-3 text-600 text-sm line-height-3">
                    <li>
                        Si al menos uno de los roles del usuario posee el
                        permiso, la operación se permite.
                    </li>
                    <li>
                        Si ninguno de sus roles posee el permiso requerido, el
                        acceso se deniega.
                    </li>
                    <li>
                        Los cambios aplican a todos los usuarios que tengan
                        asignado este rol.
                    </li>
                </ul>
            </div>

            <Message
                severity="warn"
                className="w-full"
                text="Retirar un permiso del rol no elimina el permiso del sistema."
            />
        </div>
    );
}
