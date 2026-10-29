'use client';

import Link from 'next/link';
import React, { Suspense } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import AuthCard from '../components/AuthCard';
import AuthLoading from '../components/AuthLoading';
import SocialLoginButtons from '../components/SocialLoginButtons';
import { useLogin } from './useLogin';

const LoginPageContent = () => {
    const { email, setEmail, password, setPassword, submitting, busy, error, success, submit, socialProvider, signInWith } = useLogin();

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void submit();
    };

    return (
        <AuthCard title="Iniciar sesión" subtitle="Ingresa con tu correo y contraseña">
            {success && <Message severity="success" text={success} className="w-full mb-4" />}
            {error && <Message severity="error" text={error} className="w-full mb-4" />}

            <form onSubmit={handleSubmit}>
                <label htmlFor="email" className="block text-900 font-medium mb-2">
                    Correo electrónico
                </label>
                <span className="p-input-icon-left w-full mb-4">
                    <i className="pi pi-envelope" aria-hidden="true" />
                    <InputText id="email" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full" required />
                </span>

                <div className="flex align-items-center justify-content-between mb-2">
                    <label htmlFor="password" className="text-900 font-medium">
                        Contraseña
                    </label>
                    <Link href="/auth/forgot-password" className="text-sm font-medium text-primary">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
                <Password inputId="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} toggleMask feedback={false} className="w-full mb-4" inputClassName="w-full" required />

                <Button type="submit" label="Iniciar sesión" icon="pi pi-sign-in" className="w-full" loading={submitting} disabled={busy} />
            </form>

            <SocialLoginButtons loadingProvider={socialProvider} disabled={busy} onSelect={signInWith} />

            <p className="text-center text-600 mt-5 mb-0">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/register" className="font-medium text-primary">
                    Regístrate
                </Link>
            </p>
        </AuthCard>
    );
};

export default function LoginPage() {
    return (
        <Suspense fallback={<AuthLoading />}>
            <LoginPageContent />
        </Suspense>
    );
}
