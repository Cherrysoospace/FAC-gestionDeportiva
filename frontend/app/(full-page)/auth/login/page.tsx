/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useAuth } from '../../../../layout/context/authcontext';
import { ApiRequestError } from '../../../../lib/api';

type AuthError = {
    severity: 'info' | 'warn' | 'error';
    text: string;
};

const getFirebaseErrorCode = (error: unknown): string | undefined => {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as { code?: unknown }).code;
        return typeof code === 'string' ? code : undefined;
    }

    return undefined;
};

const LoginPage = () => {
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [authError, setAuthError] = useState<AuthError | null>(null);
    const { layoutConfig } = useContext(LayoutContext);
    const { loginWithGoogle, isAuthenticated, isLoading } = useAuth();

    const router = useRouter();
    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace('/');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleGoogleLogin = async () => {
        setAuthError(null);
        setGoogleLoading(true);

        try {
            await loginWithGoogle();
        } catch (error) {
            if (error instanceof ApiRequestError) {
                switch (error.status) {
                    case 401:
                        setAuthError({ severity: 'error', text: 'No se pudo validar tu cuenta de Google' });
                        break;
                    case 403:
                        setAuthError({ severity: 'error', text: 'Tu usuario está deshabilitado' });
                        break;
                    case 409:
                        setAuthError({ severity: 'error', text: 'Ese correo ya está registrado con otro método de acceso' });
                        break;
                    case 400:
                        setAuthError({ severity: 'error', text: 'Google no entregó un correo' });
                        break;
                    case 0:
                        setAuthError({ severity: 'error', text: 'No se pudo conectar con el servidor. Inténtalo de nuevo.' });
                        break;
                    default:
                        setAuthError({ severity: 'error', text: error.message || 'No se pudo iniciar sesión' });
                }

                return;
            }

            const code = getFirebaseErrorCode(error);

            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                setAuthError({ severity: 'warn', text: 'Cancelaste el inicio de sesión con Google.' });
                return;
            }

            if (code === 'auth/popup-blocked') {
                setAuthError({ severity: 'warn', text: 'El navegador bloqueó la ventana de Google. Habilita las ventanas emergentes e inténtalo de nuevo.' });
                return;
            }

            setAuthError({ severity: 'error', text: 'No se pudo conectar con el servidor. Inténtalo de nuevo.' });
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`} alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <img src="/demo/images/login/avatar.png" alt="Image" height="50" className="mb-3" />
                            <div className="text-900 text-3xl font-medium mb-3">Welcome, Isabel!</div>
                            <span className="text-600 font-medium">Sign in to continue</span>
                        </div>

                        {authError && <Message severity={authError.severity} text={authError.text} className="w-full mb-5" />}

                        <div>
                            <label htmlFor="email1" className="block text-900 text-xl font-medium mb-2">
                                Email
                            </label>
                            <InputText id="email1" type="text" placeholder="Email address" className="w-full md:w-30rem mb-5" style={{ padding: '1rem' }} />

                            <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">
                                Password
                            </label>
                            <Password inputId="password1" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" toggleMask className="w-full mb-5" inputClassName="w-full p-3 md:w-30rem"></Password>

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox inputId="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2"></Checkbox>
                                    <label htmlFor="rememberme1">Remember me</label>
                                </div>
                                <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                    Forgot password?
                                </a>
                            </div>
                            <Button label="Sign In" className="w-full p-3 text-xl" onClick={() => router.push('/')}></Button>

                            <div className="flex align-items-center gap-3 my-4">
                                <span className="flex-1 border-top-1 surface-border"></span>
                                <span className="text-600">o</span>
                                <span className="flex-1 border-top-1 surface-border"></span>
                            </div>

                            <Button
                                type="button"
                                label="Continuar con Google"
                                icon="pi pi-google"
                                className="w-full p-3 text-xl p-button-outlined"
                                onClick={handleGoogleLogin}
                                loading={googleLoading}
                                disabled={googleLoading || isLoading}
                            ></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
