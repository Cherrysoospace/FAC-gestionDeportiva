import Link from 'next/link';
import { Skeleton } from 'primereact/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { AppModule } from '@/lib/navigation';
import styles from '../home.module.scss';

interface QuickAccessGridProps {
    modules: AppModule[];
    loading: boolean;
}

const SKELETON_ITEMS = 3;

export default function QuickAccessGrid({ modules, loading }: QuickAccessGridProps) {
    if (loading) {
        return (
            <div className="grid" aria-busy="true">
                {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
                    <div key={index} className="col-12 md:col-6 xl:col-4">
                        <Skeleton height="8rem" borderRadius="0.75rem" />
                    </div>
                ))}
            </div>
        );
    }

    if (modules.length === 0) {
        return <EmptyState icon="pi-th-large" title="Todavía no tienes módulos disponibles" description="Pide a un administrador que te asigne un rol con los permisos que necesitas." />;
    }

    return (
        <ul className="grid list-none p-0 m-0">
            {modules.map((module) => (
                <li key={module.to} className="col-12 md:col-6 xl:col-4">
                    <Link href={module.to} className={styles.quickAccess}>
                        <span className={styles.quickAccessIcon} aria-hidden="true">
                            <i className={`pi ${module.icon}`} />
                        </span>
                        <span className="flex flex-column gap-1 flex-1">
                            <span className="text-900 font-semibold text-lg">{module.label}</span>
                            <span className="text-600 text-sm line-height-3">{module.description}</span>
                        </span>
                        <i className="pi pi-arrow-right text-500" aria-hidden="true" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}
