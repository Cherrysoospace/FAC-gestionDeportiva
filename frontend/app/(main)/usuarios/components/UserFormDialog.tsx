'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import PasswordRulesList from '@/components/ui/PasswordRulesList';
import { unmetPasswordRules } from '@/lib/password-rules';
import { hasErrors, UserFormMode, validateUserForm } from '@/lib/user-form';
import { ActionResult } from '@/types/action';
import { UserAccount, UserFormValues } from '@/types/security';

interface UserFormDialogProps {
    visible: boolean;
    /** null = crear un usuario nuevo */
    user: UserAccount | null;
    onHide: () => void;
    onSubmit: (values: UserFormValues) => Promise<ActionResult>;
}

const EMPTY: UserFormValues = { name: '', email: '', password: '' };

export default function UserFormDialog({ visible, user, onHide, onSubmit }: UserFormDialogProps) {
    const mode: UserFormMode = user ? 'edit' : 'create';
    const canSetPassword = !user || user.authProvider === 'LOCAL';

    const [values, setValues] = useState<UserFormValues>(EMPTY);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Cada vez que se abre, parte de los datos del usuario (o vacío al crear)
    useEffect(() => {
        if (!visible) return;
        setValues(user ? { name: user.name, email: user.email, password: '' } : EMPTY);
        setSubmitted(false);
        setServerError(null);
    }, [visible, user]);

    const errors = validateUserForm(values, mode, canSetPassword);
    const fieldError = (field: keyof UserFormValues) => (submitted ? errors[field] : undefined);
    const setField = (field: keyof UserFormValues) => (event: { target: { value: string } }) => setValues((current) => ({ ...current, [field]: event.target.value }));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (hasErrors(errors)) return;

        setSaving(true);
        const result = await onSubmit({ ...values, name: values.name.trim(), email: values.email.trim() });
        setSaving(false);

        if (result.ok) onHide();
        else setServerError(result.error ?? 'No se pudo guardar el usuario');
    };

    return (
        <Dialog header={mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'} visible={visible} onHide={onHide} style={{ width: 'min(95vw, 32rem)' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="field">
                    <label htmlFor="user-name">Nombre</label>
                    <InputText id="user-name" value={values.name} onChange={setField('name')} className={fieldError('name') ? 'p-invalid' : undefined} autoFocus />
                    {fieldError('name') && <small className="p-error">{fieldError('name')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="user-email">Correo</label>
                    <InputText id="user-email" type="email" value={values.email} onChange={setField('email')} className={fieldError('email') ? 'p-invalid' : undefined} />
                    {fieldError('email') && <small className="p-error">{fieldError('email')}</small>}
                </div>

                {canSetPassword ? (
                    <div className="field">
                        <label htmlFor="user-password">{mode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'}</label>
                        <Password inputId="user-password" value={values.password} onChange={setField('password')} toggleMask feedback={false} className={fieldError('password') ? 'p-invalid' : undefined} />
                        {fieldError('password') && <small className="p-error block mb-1">{fieldError('password')}</small>}
                        {(mode === 'create' || values.password) && <PasswordRulesList password={values.password} unmetRules={unmetPasswordRules(values.password)} />}
                    </div>
                ) : (
                    <Message severity="info" text="Este usuario inicia sesión con un proveedor externo, así que no tiene contraseña en la plataforma." className="w-full mb-3" />
                )}

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={mode === 'create' ? 'Crear usuario' : 'Guardar cambios'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
