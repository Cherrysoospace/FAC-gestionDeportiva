/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { useAuth } from '../../../../layout/context/authcontext';
import { ApiRequestError } from '../../../../lib/api';

export default function RegisterPage() {
    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);
    const { register, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated) router.replace('/');
    }, [isAuthenticated, isLoading, router]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        if (password !== confirmation) {
            setError('Las contraseñas no coinciden');
            return;
        }
        setLoading(true);
        try {
            await register(name, email, password);
            sessionStorage.setItem('registrationSuccess', 'true');
            router.replace('/auth/login');
        } catch (cause) {
            if (cause instanceof ApiRequestError) {
                if (cause.status === 409) setError('Ya existe una cuenta con ese correo');
                else if (cause.status === 400) setError(cause.message || 'Revisa los datos ingresados');
                else if (cause.status === 0) setError('No se pudo conectar con el servidor');
                else setError(cause.message);
            } else {
                setError('No se pudo crear la cuenta');
            }
        } finally {
            setLoading(false);
        }
    };

    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`} alt="Logo" className="mb-5 w-6rem flex-shrink-0" />
                <div className="surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '24px', minWidth: 'min(90vw, 32rem)' }}>
                    <div className="text-center mb-5">
                        <div className="text-900 text-3xl font-medium mb-3">Crear cuenta</div>
                        <span className="text-600 font-medium">Regístrate con correo y contraseña</span>
                    </div>
                    {error && <Message severity="error" text={error} className="w-full mb-4" />}
                    <form onSubmit={submit}>
                        <label htmlFor="name" className="block text-900 font-medium mb-2">Nombre</label>
                        <InputText id="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full mb-3" required />
                        <label htmlFor="email" className="block text-900 font-medium mb-2">Correo</label>
                        <InputText id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full mb-3" required />
                        <label htmlFor="password" className="block text-900 font-medium mb-2">Contraseña</label>
                        <Password inputId="password" value={password} onChange={(event) => setPassword(event.target.value)} toggleMask className="w-full mb-3" inputClassName="w-full p-3" required />
                        <label htmlFor="confirmation" className="block text-900 font-medium mb-2">Confirmar contraseña</label>
                        <Password inputId="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} toggleMask className="w-full mb-4" inputClassName="w-full p-3" required />
                        <Button type="submit" label="Crear cuenta" className="w-full p-3 text-xl" loading={loading} disabled={loading || googleLoading || isLoading} />
                    </form>
                    <Button type="button" label="Continuar con Google" icon="pi pi-google" className="w-full p-3 text-xl p-button-outlined mt-3" onClick={() => void loginWithGoogle()} loading={googleLoading} disabled={loading || googleLoading || isLoading} />
                    <Button type="button" label="¿Ya tienes cuenta? Inicia sesión" link className="w-full mt-3" onClick={() => router.push('/auth/login')} />
                </div>
            </div>
        </div>
    );
}
