'use client';

import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { RadioButton } from 'primereact/radiobutton';
import { allowedTransitions, requiresConfirmation, TOURNAMENT_STATUS_LABELS } from '@/lib/tournament-labels';
import { ActionResult } from '@/types/action';
import { Tournament, TournamentStatus } from '@/types/sports';
import { TournamentStatusTag } from './TournamentBadges';

interface TournamentStatusDialogProps {
    visible: boolean;
    tournament: Tournament | null;
    onHide: () => void;
    /** La página muestra el resultado (éxito o error del backend) en un Toast. */
    onSubmit: (status: TournamentStatus) => Promise<ActionResult>;
}

const STATUS_HINTS: Partial<Record<TournamentStatus, string>> = {
    REGISTRATION_OPEN: 'Los equipos podrán inscribirse dentro del periodo de inscripción.',
    IN_PROGRESS: 'Necesita al menos 2 inscripciones activas. Se bloquean nombre, deporte y fechas.',
    FINISHED: 'El torneo queda cerrado y no se podrán modificar sus fases.',
    CANCELLED: 'El torneo queda cancelado y no se podrán modificar sus fases.'
};

export default function TournamentStatusDialog({ visible, tournament, onHide, onSubmit }: TournamentStatusDialogProps) {
    const options = tournament ? allowedTransitions(tournament.status) : [];
    const [selected, setSelected] = useState<TournamentStatus | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible && tournament) setSelected(allowedTransitions(tournament.status)[0] ?? null);
    }, [visible, tournament]);

    const submit = async (status: TournamentStatus) => {
        setSaving(true);
        const result = await onSubmit(status);
        setSaving(false);
        if (result.ok) onHide();
    };

    const handleConfirm = () => {
        if (!tournament || !selected) return;
        if (!requiresConfirmation(selected)) {
            void submit(selected);
            return;
        }
        const status = selected;
        confirmDialog({
            header: `Marcar como ${TOURNAMENT_STATUS_LABELS[status].toLowerCase()}`,
            message: `¿Seguro que quieres pasar "${tournament.name}" a ${TOURNAMENT_STATUS_LABELS[status].toLowerCase()}? Este cambio no se puede deshacer.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, cambiar',
            rejectLabel: 'Cancelar',
            acceptClassName: status === 'CANCELLED' ? 'p-button-danger' : undefined,
            accept: () => void submit(status)
        });
    };

    return (
        <Dialog header="Cambiar estado" visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-5" breakpoints={{ '640px': '95vw' }} modal>
            {tournament && (
                <div className="flex flex-column gap-3">
                    <div className="flex align-items-center gap-2">
                        <span className="text-600">Estado actual:</span>
                        <TournamentStatusTag status={tournament.status} />
                    </div>

                    {options.length === 0 ? (
                        <p className="text-600 m-0">Este torneo ya no puede cambiar de estado.</p>
                    ) : (
                        <div className="flex flex-column gap-3" role="radiogroup" aria-label="Nuevo estado">
                            {options.map((status) => (
                                <div key={status} className="flex align-items-start gap-2">
                                    <RadioButton inputId={`status-${status}`} name="tournament-status" value={status} checked={selected === status} onChange={() => setSelected(status)} />
                                    <label htmlFor={`status-${status}`} className="flex flex-column gap-1 cursor-pointer">
                                        <span className="text-900 font-medium">{TOURNAMENT_STATUS_LABELS[status]}</span>
                                        {STATUS_HINTS[status] && <small className="text-600">{STATUS_HINTS[status]}</small>}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-content-end gap-2 mt-2">
                        <Button type="button" label="Cancelar" outlined onClick={onHide} disabled={saving} />
                        {options.length > 0 && <Button type="button" label="Cambiar estado" icon="pi pi-check" onClick={handleConfirm} loading={saving} disabled={!selected} />}
                    </div>
                </div>
            )}
        </Dialog>
    );
}
