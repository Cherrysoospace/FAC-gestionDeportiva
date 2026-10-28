'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';

interface AccessDeniedProps {
    onRetry?: () => void;
}

export default function AccessDenied({ onRetry }: AccessDeniedProps) {
    const router = useRouter();

    return (
        <div className="card flex flex-column align-items-center text-center py-8">
            <div
                className="flex align-items-center justify-content-center bg-red-100 border-circle mb-4"
                style={{ width: '4rem', height: '4rem' }}
            >
                <i className="pi pi-lock text-red-500 text-3xl" />
            </div>
            <h2 className="text-900 font-bold mb-2">Acceso denegado</h2>
            <p className="text-600 line-height-3 mb-4" style={{ maxWidth: '34rem' }}>
                No cuentas con los permisos necesarios para acceder a esta
                sección. Si crees que es un error, solicita a un administrador
                que revise los permisos de tu rol.
            </p>
            <div className="flex flex-wrap justify-content-center gap-2">
                <Button
                    label="Ir al dashboard"
                    icon="pi pi-home"
                    onClick={() => router.push('/')}
                />
                {onRetry && (
                    <Button
                        label="Volver a intentar"
                        icon="pi pi-refresh"
                        outlined
                        onClick={onRetry}
                    />
                )}
            </div>
        </div>
    );
}
