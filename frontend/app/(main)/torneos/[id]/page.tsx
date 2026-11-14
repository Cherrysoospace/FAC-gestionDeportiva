'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { SPORTS_LIST_ENDPOINT, TOURNAMENT_DETAIL_ENDPOINTS, TOURNAMENT_UPDATE_ENDPOINT } from '@/lib/tournament-constants';
import { toUpdatePayload, TournamentActionResult, TournamentFormValues } from '@/lib/tournament-form';
import { allowedTransitions, formatDateTime, formatDay, TOURNAMENT_STATUS_LABELS } from '@/lib/tournament-labels';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Tournament, TournamentStatus } from '@/types/sports';
import { TournamentActiveTag, TournamentStatusTag } from '../components/TournamentBadges';
import TournamentFormDialog from '../components/TournamentFormDialog';
import TournamentStatusDialog from '../components/TournamentStatusDialog';
import { useSportOptions } from '../hooks/useSportOptions';
import { useTournamentDetail } from '../hooks/useTournamentDetail';

interface TournamentDetailPageProps {
    params: { id: string };
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
    return (
        <ProtectedRoute requiredEndpoints={TOURNAMENT_DETAIL_ENDPOINTS}>
            <TournamentDetailContent tournamentId={Number(params.id)} />
        </ProtectedRoute>
    );
}

function TournamentDetailContent({ tournamentId }: { tournamentId: number }) {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();
    const { tournament, loading, loadError, update, changeStatus, reload } = useTournamentDetail(tournamentId);
    const [dialog, setDialog] = useState<'form' | 'status' | null>(null);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canUpdate = can(TOURNAMENT_UPDATE_ENDPOINT);
    const canListSports = can(SPORTS_LIST_ENDPOINT);
    const { sports } = useSportOptions(canListSports && canUpdate);

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleUpdate = async (values: TournamentFormValues): Promise<TournamentActionResult> => {
        if (!tournament) return { ok: false };
        const result = await update(toUpdatePayload(values, tournament));
        if (result.ok || !result.validation) notify(result, 'Torneo actualizado.');
        return result;
    };

    const handleStatus = async (next: TournamentStatus): Promise<ActionResult> => {
        const result = await changeStatus(next);
        notify(result, `El torneo pasó a ${TOURNAMENT_STATUS_LABELS[next].toLowerCase()}.`, 'No se pudo cambiar el estado');
        return result;
    };

    const actions = (
        <div className="flex flex-wrap gap-2">
            <Button label="Volver al listado" icon="pi pi-arrow-left" text onClick={() => router.push('/torneos')} />
            {tournament && canUpdate && <Button label="Editar" icon="pi pi-pencil" outlined onClick={() => setDialog('form')} />}
            {tournament && canUpdate && allowedTransitions(tournament.status).length > 0 && <Button label="Cambiar estado" icon="pi pi-flag" onClick={() => setDialog('status')} />}
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title={tournament?.name ?? 'Detalle del torneo'}
                subtitle={tournament ? `${tournament.sport.name} · ${formatDay(tournament.startDate)} – ${formatDay(tournament.endDate)}` : 'Información del torneo, sus fases e inscripciones.'}
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Torneos', href: '/torneos' }, { label: tournament?.name ?? 'Detalle' }]}
                actions={actions}
            />

            {loadError && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={loadError} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            {loading && !tournament && <Skeleton height="18rem" />}

            {tournament && (
                <div className="card">
                    <div className="flex flex-wrap align-items-center gap-2 mb-3">
                        <TournamentStatusTag status={tournament.status} />
                        <TournamentActiveTag active={tournament.active} />
                    </div>
                    <TabView>
                        <TabPanel header="Información">
                            <TournamentInfo tournament={tournament} />
                        </TabPanel>
                        <TabPanel header="Fases finales">
                            <ComingSoon />
                        </TabPanel>
                        <TabPanel header="Inscripciones">
                            <ComingSoon />
                        </TabPanel>
                        <TabPanel header="Escenarios">
                            <ComingSoon />
                        </TabPanel>
                    </TabView>
                </div>
            )}

            <TournamentFormDialog visible={dialog === 'form'} tournament={tournament} sports={sports} canListSports={canListSports} onHide={() => setDialog(null)} onSubmit={handleUpdate} />
            <TournamentStatusDialog visible={dialog === 'status'} tournament={tournament} onHide={() => setDialog(null)} onSubmit={handleStatus} />
        </>
    );
}

function TournamentInfo({ tournament }: { tournament: Tournament }) {
    const rows: [string, string | number][] = [
        ['Deporte', tournament.sport.name],
        ['Fecha de inicio', formatDay(tournament.startDate)],
        ['Fecha de fin', formatDay(tournament.endDate)],
        ['Apertura de inscripciones', formatDateTime(tournament.registrationOpensAt)],
        ['Cierre de inscripciones', formatDateTime(tournament.registrationClosesAt)],
        ['Estado', TOURNAMENT_STATUS_LABELS[tournament.status]],
        ['Equipos inscritos', tournament.registrationsCount],
        ['Fases', tournament.phasesCount]
    ];

    return (
        <ul className="list-none p-0 m-0">
            {rows.map(([label, value]) => (
                <li key={label} className="flex flex-column sm:flex-row sm:justify-content-between py-2 border-bottom-1 surface-border">
                    <span className="text-600">{label}</span>
                    <span className="text-900 font-medium">{value}</span>
                </li>
            ))}
        </ul>
    );
}

function ComingSoon() {
    return <EmptyState icon="pi-clock" title="Disponible próximamente" description="Esta sección se habilitará en una próxima versión." />;
}
