'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from 'primereact/button';
import AuthCard from '../components/AuthCard';

const AccessDeniedPage = () => {
    const router = useRouter();

    return (
        <AuthCard icon="pi-lock" tone="warning" title="Acceso denegado" subtitle="No tienes los permisos necesarios para ver esta sección. Si crees que es un error, pide a un administrador que revise tu rol.">
            <Button icon="pi pi-home" label="Ir al inicio" className="w-full" onClick={() => router.push('/')} />
        </AuthCard>
    );
};

export default AccessDeniedPage;
