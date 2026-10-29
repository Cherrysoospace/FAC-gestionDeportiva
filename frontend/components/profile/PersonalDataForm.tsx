'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { parseIsoDate, toIsoDate } from '@/lib/dates';
import { validatePhone } from '@/lib/profile-rules';
import { PersonalDataInput } from '@/types/profile';

interface PersonalDataFormProps {
    profile: { phone: string | null; birthDate: string | null };
    saving: boolean;
    onSave: (data: PersonalDataInput) => void;
    title?: string;
}

const yesterday = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
};

// Teléfono y fecha de nacimiento; lo usan el propio usuario (Mi perfil) y el administrador.
export default function PersonalDataForm({ profile, saving, onSave, title = 'Datos personales' }: PersonalDataFormProps) {
    const [phone, setPhone] = useState(profile.phone ?? '');
    const [birthDate, setBirthDate] = useState<Date | null>(parseIsoDate(profile.birthDate));

    // Si el perfil cambia desde el servidor (p. ej. tras guardar), se refleja en el formulario
    useEffect(() => {
        setPhone(profile.phone ?? '');
        setBirthDate(parseIsoDate(profile.birthDate));
    }, [profile.phone, profile.birthDate]);

    const phoneError = validatePhone(phone);
    const unchanged = phone === (profile.phone ?? '') && toIsoDate(birthDate) === profile.birthDate;

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSave({ phone, birthDate: toIsoDate(birthDate) });
    };

    return (
        <form className="card h-full" onSubmit={handleSubmit}>
            <h5>{title}</h5>
            <div className="p-fluid formgrid grid">
                <div className="field col-12 md:col-6">
                    <label htmlFor="phone">Teléfono</label>
                    <InputText id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} keyfilter="int" maxLength={15} placeholder="3001234567" className={phoneError ? 'p-invalid' : undefined} aria-describedby="phone-help" />
                    <small id="phone-help" className={phoneError ? 'p-error' : 'text-500'}>
                        {phoneError ?? 'Solo números, entre 7 y 15 dígitos.'}
                    </small>
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="birthDate">Fecha de nacimiento</label>
                    <Calendar inputId="birthDate" value={birthDate} onChange={(event) => setBirthDate((event.value as Date | null) ?? null)} dateFormat="dd/mm/yy" maxDate={yesterday()} showIcon showButtonBar placeholder="dd/mm/aaaa" />
                </div>
            </div>
            <div className="flex justify-content-end">
                <Button type="submit" label="Guardar cambios" icon="pi pi-check" loading={saving} disabled={unchanged || phoneError !== null} />
            </div>
        </form>
    );
}
