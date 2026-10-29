'use client';

import Link from 'next/link';
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import PasswordRulesList from '@/components/ui/PasswordRulesList';
import AuthCard from '../components/AuthCard';
import SocialLoginButtons from '../components/SocialLoginButtons';
import { useRegister } from './useRegister';

export default function RegisterPage() {
    const { name, setName, email, setEmail, password, setPassword, confirmation, setConfirmation, unmetRules, passwordsMatch, submitting, busy, error, submit, socialProvider, signInWith } = useRegister();

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void submit();
    };

    return (
        <AuthCard title="Crear cuenta" subtitle="Regístrate para acceder al sistema">
            {error && <Message severity="error" text={error} className="w-full mb-4" />}

            <form onSubmit={handleSubmit}>
                <label htmlFor="name" className="block text-900 font-medium mb-2">
                    Nombre completo
                </label>
                <span className="p-input-icon-left w-full mb-3">
                    <i className="pi pi-user" aria-hidden="true" />
                    <InputText id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full" required />
                </span>

                <label htmlFor="email" className="block text-900 font-medium mb-2">
                    Correo electrónico
                </label>
                <span className="p-input-icon-left w-full mb-3">
                    <i className="pi pi-envelope" aria-hidden="true" />
                    <InputText id="email" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full" required />
                </span>

                <label htmlFor="password" className="block text-900 font-medium mb-2">
                    Contraseña
                </label>
                <Password
                    inputId="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    toggleMask
                    feedback={false}
                    className="w-full mb-2"
                    inputClassName="w-full"
                    aria-describedby="password-rules"
                    required
                />
                <div id="password-rules" className="mb-3">
                    <PasswordRulesList password={password} unmetRules={unmetRules} />
                </div>

                <label htmlFor="confirmation" className="block text-900 font-medium mb-2">
                    Confirmar contraseña
                </label>
                <Password
                    inputId="confirmation"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    toggleMask
                    feedback={false}
                    className={classNames('w-full', passwordsMatch ? 'mb-4' : 'mb-1')}
                    inputClassName={classNames('w-full', { 'p-invalid': !passwordsMatch })}
                    aria-describedby={passwordsMatch ? undefined : 'confirmation-error'}
                    required
                />
                {!passwordsMatch && (
                    <small id="confirmation-error" className="p-error block mb-4">
                        Las contraseñas no coinciden
                    </small>
                )}

                <Button type="submit" label="Crear cuenta" icon="pi pi-user-plus" className="w-full" loading={submitting} disabled={busy} />
            </form>

            <SocialLoginButtons loadingProvider={socialProvider} disabled={busy} onSelect={signInWith} />

            <p className="text-center text-600 mt-5 mb-0">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" className="font-medium text-primary">
                    Inicia sesión
                </Link>
            </p>
        </AuthCard>
    );
}
