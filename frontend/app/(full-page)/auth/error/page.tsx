'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from 'primereact/button';
import AuthCard from '../components/AuthCard';

const ErrorPage = () => {
    const router = useRouter();

    return (
        <AuthCard icon="pi-exclamation-triangle" tone="danger" title="Algo salió mal" subtitle="Ocurrió un problema inesperado. Intenta de nuevo en unos minutos.">
            <div className="flex flex-column gap-2">
                <Button icon="pi pi-refresh" label="Intentar de nuevo" className="w-full" onClick={() => router.refresh()} />
                <Button icon="pi pi-home" label="Ir al inicio" outlined className="w-full" onClick={() => router.push('/')} />
            </div>
        </AuthCard>
    );
};

export default ErrorPage;
