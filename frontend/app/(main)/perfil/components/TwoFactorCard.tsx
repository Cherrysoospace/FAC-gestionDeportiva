'use client';

import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { authProviderLabel } from '@/lib/profile-rules';
import { TwoFactorStatus } from '@/types/two-factor';

interface TwoFactorCardProps {
    status: TwoFactorStatus | null;
    authProvider: string;
    loading: boolean;
    loadError: string | null;
    saving: boolean;
    /** Devuelve true si el cambio se guardó, para cerrar la confirmación */
    onChange: (enabled: boolean, currentPassword: string) => Promise<boolean>;
}

// Activar o desactivar el segundo factor. Cambiarlo exige la contraseña actual.
export default function TwoFactorCard({ status, authProvider, loading, loadError, saving, onChange }: TwoFactorCardProps) {
    const [confirming, setConfirming] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');

    const closeConfirmation = () => {
        setConfirming(false);
        setCurrentPassword('');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!status) return;
        if (await onChange(!status.enabled, currentPassword)) closeConfirmation();
    };

    return (
        <div className="card">
            <div className="flex align-items-center justify-content-between gap-3 mb-3">
                <h5 className="m-0">
                    <i className="pi pi-shield mr-2" aria-hidden="true" />
                    Autenticación de dos factores
                </h5>
                {status?.available && <Tag value={status.enabled ? 'Activada' : 'Desactivada'} severity={status.enabled ? 'success' : 'warning'} />}
            </div>

            {loading && <Skeleton height="4rem" />}
            {loadError && <Message severity="error" text={loadError} className="w-full" />}

            {status && !status.available && (
                <Message
                    severity="info"
                    className="w-full justify-content-start"
                    text={`Tu cuenta inicia sesión con ${authProviderLabel(authProvider)}. La verificación adicional la gestiona ese proveedor.`}
                />
            )}

            {status?.available && (
                <>
                    <p className="text-600 line-height-3 mt-0">
                        {status.enabled
                            ? 'Cada vez que inicies sesión con tu correo y contraseña te pediremos un código que enviamos a tu correo.'
                            : 'Agrega una capa de seguridad: además de tu contraseña, te pediremos un código enviado a tu correo al iniciar sesión.'}
                    </p>

                    {confirming ? (
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="two-factor-password" className="block text-900 font-medium mb-2">
                                Confirma con tu contraseña actual
                            </label>
                            <Password
                                inputId="two-factor-password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                toggleMask
                                feedback={false}
                                className="w-full mb-3"
                                inputClassName="w-full"
                                autoFocus
                                required
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="submit"
                                    label={status.enabled ? 'Desactivar' : 'Activar'}
                                    icon="pi pi-check"
                                    severity={status.enabled ? 'danger' : undefined}
                                    loading={saving}
                                    disabled={!currentPassword}
                                />
                                <Button type="button" label="Cancelar" outlined disabled={saving} onClick={closeConfirmation} />
                            </div>
                        </form>
                    ) : (
                        <Button
                            type="button"
                            label={status.enabled ? 'Desactivar 2FA' : 'Activar 2FA'}
                            icon={status.enabled ? 'pi pi-lock-open' : 'pi pi-lock'}
                            severity={status.enabled ? 'danger' : undefined}
                            outlined={status.enabled}
                            onClick={() => setConfirming(true)}
                        />
                    )}
                </>
            )}
        </div>
    );
}
