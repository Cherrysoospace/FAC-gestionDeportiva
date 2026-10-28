/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useContext, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { useAuth } from '../../../../layout/context/authcontext';
import { ApiRequestError } from '../../../../lib/api';

const LoginPageContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { layoutConfig } = useContext(LayoutContext);
    const {
        loginWithCredentials,
        loginWithGoogle,
        isAuthenticated,
        isLoading
    } = useAuth();

    const requestedDestination = searchParams.get('next') || '/';
    const nextPath =
        requestedDestination.startsWith('/') &&
        !requestedDestination.startsWith('//') &&
        !requestedDestination.includes('\\')
            ? requestedDestination
            : '/';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace(nextPath);
        }
    }, [isAuthenticated, isLoading, nextPath, router]);

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('registrationSuccess')) {
            setSuccess('Cuenta creada. Inicia sesión.');
            sessionStorage.removeItem('registrationSuccess');
        }
    }, []);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await loginWithCredentials(email, password, nextPath);
        } catch (cause) {
            if (cause instanceof ApiRequestError && cause.status === 0) {
                setError('No se pudo conectar con el servidor');
            } else if (cause instanceof ApiRequestError && cause.status === 403) {
                setError('Tu usuario está deshabilitado');
            } else {
                setError('Credenciales incorrectas');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setGoogleLoading(true);
        try {
            await loginWithGoogle(nextPath);
        } catch (cause) {
            setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo iniciar sesión con Google');
        } finally {
            setGoogleLoading(false);
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
                        <div className="text-900 text-3xl font-medium mb-3">Iniciar sesión</div>
                        <span className="text-600 font-medium">Accede con tu correo y contraseña</span>
                    </div>
                    {success && <Message severity="success" text={success} className="w-full mb-4" />}
                    {error && <Message severity="error" text={error} className="w-full mb-4" />}
                    <form onSubmit={handleLogin}>
                        <label htmlFor="email" className="block text-900 font-medium text-xl mb-2">Correo</label>
                        <InputText id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full mb-4" required />
                        <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">Contraseña</label>
                        <Password inputId="password" value={password} onChange={(event) => setPassword(event.target.value)} toggleMask className="w-full mb-4" inputClassName="w-full p-3" required />
                        <Button type="submit" label="Iniciar sesión" className="w-full p-3 text-xl" loading={loading} disabled={loading || googleLoading || isLoading} />
                    </form>
                    <Button type="button" label="Continuar con Google" icon="pi pi-google" className="w-full p-3 text-xl p-button-outlined mt-3" onClick={handleGoogleLogin} loading={googleLoading} disabled={loading || googleLoading || isLoading} />
                    <Button type="button" label="¿No tienes cuenta? Regístrate" link className="w-full mt-3" onClick={() => router.push('/auth/register')} />
                </div>
            </div>
        </div>
    );
};

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="surface-ground flex align-items-center justify-content-center min-h-screen">
                    <i
                        className="pi pi-spin pi-spinner"
                        style={{ fontSize: '2rem' }}
                    />
                </div>
            }
        >
            <LoginPageContent />
        </Suspense>
    );
}
