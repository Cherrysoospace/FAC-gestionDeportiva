'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import styles from '@/components/ui/ui.module.scss';

interface AccessDeniedProps {
    onRetry?: () => void;
}

export default function AccessDenied({ onRetry }: AccessDeniedProps) {
    const router = useRouter();

    return (
        <div className="card flex flex-column align-items-center text-center py-8">
            <span
                className={`${styles.statusBadge} bg-red-100 mb-4`}
                aria-hidden="true"
            >
                <i className="pi pi-lock text-red-500 text-3xl" />
            </span>
            <h2 className="text-900 font-bold mb-2">Acceso denegado</h2>
            <p className={`text-600 line-height-3 mb-4 ${styles.readableText}`}>
                No cuentas con los permisos necesarios para acceder a esta
                sección. Si crees que es un error, solicita a un administrador
                que revise los permisos de tu rol.
            </p>
            <div className="flex flex-wrap justify-content-center gap-2">
                <Button
                    label="Ir al inicio"
                    icon="pi pi-home"
                    onClick={() => router.push('/')}
                />
                {onRetry && (
                    <Button
                        label="Intentar de nuevo"
                        icon="pi pi-refresh"
                        outlined
                        onClick={onRetry}
                    />
                )}
            </div>
        </div>
    );
}
