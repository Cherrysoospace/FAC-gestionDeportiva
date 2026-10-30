'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { TwoFactorChallenge } from '@/types/two-factor';
import { TWO_FACTOR_MAX_LENGTH, useTwoFactorStep } from './useTwoFactorStep';

interface TwoFactorStepProps {
    challenge: TwoFactorChallenge;
    nextPath: string;
    onCancel: () => void;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

// Segundo paso del login con correo y contraseña (HU-SE-10)
export default function TwoFactorStep({ challenge, nextPath, onCancel }: TwoFactorStepProps) {
    const { destination, expiresAt, code, setCode, expired, canVerify, verifying, resending, resendInSeconds, error, info, verify, resend } = useTwoFactorStep(challenge, nextPath);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void verify();
    };

    return (
        <>
            {error && <Message severity="error" text={error} className="w-full mb-4" />}
            {info && <Message severity="success" text={info} className="w-full mb-4" />}
            {expired && <Message severity="warn" text="El código expiró. Pide uno nuevo para continuar." className="w-full mb-4" />}

            <p className="text-600 line-height-3 mt-0 mb-4">
                Enviamos un código de verificación a <span className="font-medium text-900">{destination}</span>. Vence a las {formatTime(expiresAt)}.
            </p>

            <form onSubmit={handleSubmit}>
                <label htmlFor="two-factor-code" className="block text-900 font-medium mb-2">
                    Código de verificación
                </label>
                <InputText
                    id="two-factor-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={TWO_FACTOR_MAX_LENGTH}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="w-full mb-4 text-center text-2xl"
                    style={{ letterSpacing: '0.5rem' }}
                    disabled={verifying}
                    autoFocus
                    required
                />

                <Button type="submit" label="Verificar" icon="pi pi-check" className="w-full" loading={verifying} disabled={!canVerify} />
            </form>

            <Button
                type="button"
                label={resendInSeconds > 0 ? `Reenviar código en ${resendInSeconds} s` : 'Reenviar código'}
                icon="pi pi-refresh"
                link
                className="w-full mt-3"
                loading={resending}
                disabled={resendInSeconds > 0 || verifying}
                onClick={() => void resend()}
            />
            <Button type="button" label="Cancelar e iniciar sesión de nuevo" icon="pi pi-arrow-left" link severity="secondary" className="w-full" disabled={verifying} onClick={onCancel} />
        </>
    );
}
