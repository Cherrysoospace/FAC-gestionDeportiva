import StatCard from '@/components/ui/StatCard';

interface UserRoleStatsProps {
    assignedCount: number;
    availableCount: number;
    effectiveCount: number;
    loading?: boolean;
    permissionsLoading?: boolean;
}

export default function UserRoleStats({
    assignedCount,
    availableCount,
    effectiveCount,
    loading = false,
    permissionsLoading = false
}: UserRoleStatsProps) {
    return (
        <div className="grid grid-nogutter mb-4">
            <div className="col-12 sm:col-4 lg:col-12 p-1">
                <StatCard
                    label="Roles asignados"
                    icon="pi-shield"
                    value={assignedCount}
                    loading={loading}
                />
            </div>
            <div className="col-12 sm:col-4 lg:col-12 p-1">
                <StatCard
                    label="Roles disponibles"
                    icon="pi-list"
                    value={availableCount}
                    loading={loading}
                />
            </div>
            <div className="col-12 sm:col-4 lg:col-12 p-1">
                <StatCard
                    label="Permisos efectivos"
                    icon="pi-key"
                    value={effectiveCount}
                    loading={loading || permissionsLoading}
                />
            </div>
        </div>
    );
}
