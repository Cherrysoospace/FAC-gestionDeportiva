'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import AuthCard from '../components/AuthCard';
import { useForgotPassword } from './useForgotPassword';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { email, setEmail, status, message, error, submit } = useForgotPassword();

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void submit();
    };

    return (
        <AuthCard title="Recuperar contraseña" subtitle="Te enviaremos un enlace para crear una nueva">
            {error && <Message severity="error" text={error} className="w-full mb-4" />}

            {status === 'sent' ? (
                <>
                    <Message severity="success" text={message ?? ''} className="w-full mb-4" />
                    <p className="text-600 line-height-3 mt-0">
                        Si iniciaste sesión con Google, GitHub o Discord, no tienes contraseña en esta plataforma: recupera el acceso con ese proveedor.
                    </p>
                </>
            ) : (
                <form onSubmit={handleSubmit}>
                    <label htmlFor="email" className="block text-900 font-medium mb-2">
                        Correo
                    </label>
                    <InputText id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full mb-4" autoFocus required />
                    <Button type="submit" label="Enviar enlace" className="w-full p-3 text-xl" loading={status === 'sending'} />
                </form>
            )}

            <Button type="button" label="Volver a iniciar sesión" link className="w-full mt-3" onClick={() => router.push('/auth/login')} />
        </AuthCard>
    );
}
