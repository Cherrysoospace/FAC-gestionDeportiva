'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { hasErrors, toFormValues, TournamentActionResult, TournamentFormValues, validateTournamentForm } from '@/lib/tournament-form';
import { isTournamentLocked, TOURNAMENT_STATUS_LABELS } from '@/lib/tournament-labels';
import { Sport, Tournament } from '@/types/sports';

interface TournamentFormDialogProps {
    visible: boolean;
    /** null = crear un torneo nuevo */
    tournament: Tournament | null;
    /** Deportes activos (GET /sports?active=true) */
    sports: Sport[];
    /** El usuario tiene GET /gestion-deportiva/sports */
    canListSports: boolean;
    onHide: () => void;
    onSubmit: (values: TournamentFormValues) => Promise<TournamentActionResult>;
}

type DateField = 'startDate' | 'endDate' | 'registrationOpensAt' | 'registrationClosesAt';

export default function TournamentFormDialog({ visible, tournament, sports, canListSports, onHide, onSubmit }: TournamentFormDialogProps) {
    const editing = tournament !== null;
    const locked = tournament ? isTournamentLocked(tournament.status) : false;

    const [values, setValues] = useState<TournamentFormValues>(toFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Cada vez que se abre, parte de los datos del torneo (o vacío al crear)
    useEffect(() => {
        if (!visible) return;
        setValues(toFormValues(tournament));
        setSubmitted(false);
        setServerError(null);
    }, [visible, tournament]);

    // Al editar se muestra también el deporte actual, aunque esté inactivo
    const sportOptions = useMemo(() => {
        const options = sports.map((sport) => ({ label: sport.name, value: sport.id }));
        if (tournament && !sports.some((sport) => sport.id === tournament.sport.id)) {
            options.unshift({ label: canListSports ? `${tournament.sport.name} (inactivo)` : tournament.sport.name, value: tournament.sport.id });
        }
        return options;
    }, [sports, tournament, canListSports]);

    const errors = validateTournamentForm(values);
    const fieldError = (field: keyof TournamentFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof TournamentFormValues) => (fieldError(field) ? 'p-invalid' : undefined);
    const setDate = (field: DateField) => (event: { value?: Date | Date[] | null | string }) => setValues((current) => ({ ...current, [field]: event.value instanceof Date ? event.value : null }));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (hasErrors(errors)) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        // Errores por campo del backend: se muestran aquí. Los demás los muestra la página en un Toast.
        else if (result.validation) setServerError(result.error ?? 'Revisa los datos del torneo');
    };

    return (
        <Dialog header={editing ? 'Editar torneo' : 'Nuevo torneo'} visible={visible} onHide={onHide} className="w-full md:w-10 lg:w-8 xl:w-6" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                {locked && tournament && (
                    <Message
                        severity="info"
                        text={`El torneo está ${TOURNAMENT_STATUS_LABELS[tournament.status].toLowerCase()}: ya no se pueden cambiar el nombre, el deporte ni las fechas. Puedes cambiar su estado o desactivarlo.`}
                        className="w-full mb-3"
                    />
                )}

                {!canListSports && <Message severity="warn" text="No tienes permiso para consultar los deportes (GET /gestion-deportiva/sports), así que no puedes elegir otro deporte." className="w-full mb-3" />}

                <div className="field">
                    <label htmlFor="tournament-name">Nombre</label>
                    <InputText id="tournament-name" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} className={invalidClass('name')} disabled={locked} autoFocus />
                    {fieldError('name') && <small className="p-error">{fieldError('name')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="tournament-sport">Deporte</label>
                    <Dropdown
                        inputId="tournament-sport"
                        value={values.sportId}
                        options={sportOptions}
                        onChange={(event) => setValues((current) => ({ ...current, sportId: (event.value as number | null) ?? null }))}
                        placeholder="Selecciona un deporte"
                        emptyMessage="No hay deportes activos"
                        filter={sportOptions.length > 8}
                        className={invalidClass('sportId')}
                        disabled={locked || !canListSports}
                    />
                    {fieldError('sportId') && <small className="p-error">{fieldError('sportId')}</small>}
                </div>

                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="tournament-start">Fecha de inicio</label>
                        <Calendar inputId="tournament-start" value={values.startDate} onChange={setDate('startDate')} dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" showIcon className={invalidClass('startDate')} disabled={locked} />
                        {fieldError('startDate') && <small className="p-error">{fieldError('startDate')}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="tournament-end">Fecha de fin</label>
                        <Calendar
                            inputId="tournament-end"
                            value={values.endDate}
                            onChange={setDate('endDate')}
                            dateFormat="dd/mm/yy"
                            placeholder="dd/mm/aaaa"
                            minDate={values.startDate ?? undefined}
                            showIcon
                            className={invalidClass('endDate')}
                            disabled={locked}
                        />
                        {fieldError('endDate') && <small className="p-error">{fieldError('endDate')}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="tournament-opens">Apertura de inscripciones</label>
                        <Calendar
                            inputId="tournament-opens"
                            value={values.registrationOpensAt}
                            onChange={setDate('registrationOpensAt')}
                            dateFormat="dd/mm/yy"
                            placeholder="dd/mm/aaaa hh:mm"
                            showTime
                            hourFormat="24"
                            showIcon
                            className={invalidClass('registrationOpensAt')}
                            disabled={locked}
                        />
                        {fieldError('registrationOpensAt') && <small className="p-error">{fieldError('registrationOpensAt')}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="tournament-closes">Cierre de inscripciones</label>
                        <Calendar
                            inputId="tournament-closes"
                            value={values.registrationClosesAt}
                            onChange={setDate('registrationClosesAt')}
                            dateFormat="dd/mm/yy"
                            placeholder="dd/mm/aaaa hh:mm"
                            showTime
                            hourFormat="24"
                            showIcon
                            className={invalidClass('registrationClosesAt')}
                            disabled={locked}
                        />
                        {fieldError('registrationClosesAt') && <small className="p-error">{fieldError('registrationClosesAt')}</small>}
                    </div>
                </div>

                {editing && (
                    <div className="field flex align-items-center gap-2">
                        <InputSwitch inputId="tournament-active" checked={values.active} onChange={(event) => setValues((current) => ({ ...current, active: Boolean(event.value) }))} />
                        <label htmlFor="tournament-active" className="m-0">
                            {values.active ? 'Activo' : 'Inactivo'}
                        </label>
                    </div>
                )}

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Crear torneo'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
