import React from 'react';
import Link from 'next/link';
import AuthCard from '../../auth/components/AuthCard';

const NotFoundPage = () => {
    return (
        <AuthCard icon="pi-compass" title="Página no encontrada" subtitle="La dirección que buscas no existe o fue movida.">
            <Link href="/" className="p-button w-full justify-content-center gap-2">
                <i className="pi pi-home" aria-hidden="true" />
                <span className="font-bold">Volver al inicio</span>
            </Link>
        </AuthCard>
    );
};

export default NotFoundPage;
