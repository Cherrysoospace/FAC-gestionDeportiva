'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { SPORTS_LIST_ENDPOINT, TOURNAMENT_CREATE_ENDPOINT, TOURNAMENT_DELETE_ENDPOINT, TOURNAMENT_DETAIL_ENDPOINTS, TOURNAMENT_UPDATE_ENDPOINT, TOURNAMENTS_VIEW_ENDPOINTS } from '@/lib/tournament-constants';
import { toCreatePayload, toUpdatePayload, TournamentActionResult, TournamentFormValues } from '@/lib/tournament-form';
import { allowedTransitions, formatDateTime, formatDay, TOURNAMENT_STATUS_LABELS, TOURNAMENT_STATUS_OPTIONS } from '@/lib/tournament-labels';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Tournament, TournamentStatus } from '@/types/sports';
import { TournamentActiveTag, TournamentStatusTag } from './components/TournamentBadges';
import TournamentFormDialog from './components/TournamentFormDialog';
import TournamentStatusDialog from './components/TournamentStatusDialog';
import { useSportOptions } from './hooks/useSportOptions';
import { useTournaments } from './hooks/useTournaments';

const SEARCH_DEBOUNCE_MS = 400;

const SKELETON_ROWS: Tournament[] = Array.from({ length: 5 }, (_, index) => ({
    id: -(index + 1),
    name: '',
    sport: { id: 0, name: '' },
    startDate: '',
    endDate: '',
    registrationOpensAt: '',
    registrationClosesAt: '',
    status: 'PLANNED',
    active: true,
    registrationsCount: 0,
    phasesCount: 0
}));

const ACTIVE_OPTIONS = [
    { label: 'Todos', value: null },
    { label: 'Sí', value: true },
    { label: 'No', value: false }
];

type DialogState = { kind: 'form' | 'status' | null; tournament: Tournament | null };

export default function TournamentsPage() {
    return (
        <ProtectedRoute requiredEndpoints={TOURNAMENTS_VIEW_ENDPOINTS}>
            <TournamentsContent />
        </ProtectedRoute>
    );
}

function TournamentsContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [sportId, setSportId] = useState<number | null>(null);
    const [status, setStatus] = useState<TournamentStatus | null>(null);
    const [active, setActive] = useState<boolean | null>(null);
    const [dialog, setDialog] = useState<DialogState>({ kind: null, tournament: null });

    // Búsqueda por nombre con espera de 400 ms para no consultar en cada tecla
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchText), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchText]);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canCreate = can(TOURNAMENT_CREATE_ENDPOINT);
    const canUpdate = can(TOURNAMENT_UPDATE_ENDPOINT);
    const canDelete = can(TOURNAMENT_DELETE_ENDPOINT);
    const canViewDetail = can(...TOURNAMENT_DETAIL_ENDPOINTS);
    const canListSports = can(SPORTS_LIST_ENDPOINT);
    const hasActions = canUpdate || canDelete || canViewDetail;

    const { tournaments, loading, error, reload, create, update, changeStatus, remove } = useTournaments({ search, sportId, status, active });
    const { sports } = useSportOptions(canListSports);
    const sportFilterOptions = sports.map((sport) => ({ label: sport.name, value: sport.id }));

    const closeDialog = () => setDialog({ kind: null, tournament: null });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleSubmit = async (values: TournamentFormValues): Promise<TournamentActionResult> => {
        const editing = dialog.tournament;
        const result = editing ? await update(editing.id, toUpdatePayload(values, editing)) : await create(toCreatePayload(values));
        // Los errores por campo los muestra el formulario; el resto, un Toast
        if (result.ok || !result.validation) notify(result, editing ? 'Torneo actualizado.' : 'Torneo creado.');
        return result;
    };

    const handleStatus = async (next: TournamentStatus): Promise<ActionResult> => {
        const target = dialog.tournament;
        if (!target) return { ok: false };
        const result = await changeStatus(target.id, next);
        notify(result, `El torneo pasó a ${TOURNAMENT_STATUS_LABELS[next].toLowerCase()}.`, 'No se pudo cambiar el estado');
        return result;
    };

    const handleDelete = (tournament: Tournament) =>
        confirmDialog({
            header: 'Eliminar torneo',
            message: `¿Eliminar "${tournament.name}"? Solo se puede eliminar si no tiene fases, inscripciones ni escenarios.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await remove(tournament.id);
                // 409: el backend explica qué tiene asociado; se sugiere cancelar o desactivar
                const detail = result.ok ? `"${tournament.name}" fue eliminado.` : `${result.error} Si ya no se va a jugar, cámbialo a Cancelado o desactívalo desde Editar.`;
                notify({ ...result, error: detail }, detail, 'No se puede eliminar');
            }
        });

    // Cuerpo de columna que muestra un Skeleton mientras carga
    const cell = (render: (tournament: Tournament) => ReactNode, width = '6rem') =>
        function CellBody(tournament: Tournament) {
            return loading ? <Skeleton width={width} /> : render(tournament);
        };

    const nameBody = cell((tournament) => <span className={tournament.active ? 'text-900 font-medium' : 'text-500 font-medium'}>{tournament.name}</span>, '10rem');
    const sportBody = cell((tournament) => tournament.sport.name);
    const datesBody = cell((tournament) => `${formatDay(tournament.startDate)} – ${formatDay(tournament.endDate)}`, '10rem');
    const registrationBody = cell(
        (tournament) => (
            <div className="flex flex-column text-sm">
                <span>Desde {formatDateTime(tournament.registrationOpensAt)}</span>
                <span>Hasta {formatDateTime(tournament.registrationClosesAt)}</span>
            </div>
        ),
        '10rem'
    );
    const statusBody = cell((tournament) => <TournamentStatusTag status={tournament.status} />);
    const registrationsBody = cell((tournament) => tournament.registrationsCount, '2rem');
    const phasesBody = cell((tournament) => tournament.phasesCount, '2rem');
    const activeBody = cell((tournament) => <TournamentActiveTag active={tournament.active} />, '4rem');

    const actionsBody = (tournament: Tournament) => {
        if (loading) return <Skeleton width="10rem" height="2rem" />;
        const canChangeStatus = canUpdate && allowedTransitions(tournament.status).length > 0;

        return (
            <div className="flex gap-1">
                {canViewDetail && <Button icon="pi pi-eye" rounded text tooltip="Ver detalle" tooltipOptions={{ position: 'top' }} aria-label={`Ver detalle de ${tournament.name}`} onClick={() => router.push(`/torneos/${tournament.id}`)} />}
                {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar ${tournament.name}`} onClick={() => setDialog({ kind: 'form', tournament })} />}
                {canChangeStatus && <Button icon="pi pi-flag" rounded text tooltip="Cambiar estado" tooltipOptions={{ position: 'top' }} aria-label={`Cambiar estado de ${tournament.name}`} onClick={() => setDialog({ kind: 'status', tournament })} />}
                {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label={`Eliminar ${tournament.name}`} onClick={() => handleDelete(tournament)} />}
            </div>
        );
    };

    const hasFilters = Boolean(search.trim()) || sportId !== null || status !== null || active !== null;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Torneos"
                subtitle="Crea torneos, define sus fechas y avanza su estado. Desde el detalle se gestionan sus fases e inscripciones."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Torneos' }]}
                actions={canCreate && <Button label="Nuevo torneo" icon="pi pi-plus" onClick={() => setDialog({ kind: 'form', tournament: null })} />}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            <div className="card">
                <h5>Listado de torneos</h5>
                <div className="grid mb-2">
                    <div className="col-12 md:col-6 lg:col-3">
                        <SearchInput value={searchText} onChange={setSearchText} ariaLabel="Buscar torneos por nombre" placeholder="Buscar por nombre" className="w-full" />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown
                            value={sportId}
                            options={sportFilterOptions}
                            onChange={(event) => setSportId((event.value as number | null) ?? null)}
                            placeholder={canListSports ? 'Todos los deportes' : 'Sin permiso para ver deportes'}
                            aria-label="Filtrar por deporte"
                            showClear
                            disabled={!canListSports}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown
                            value={status}
                            options={TOURNAMENT_STATUS_OPTIONS}
                            onChange={(event) => setStatus((event.value as TournamentStatus | null) ?? null)}
                            placeholder="Todos los estados"
                            aria-label="Filtrar por estado"
                            showClear
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown value={active} options={ACTIVE_OPTIONS} onChange={(event) => setActive((event.value as boolean | null) ?? null)} aria-label="Filtrar por activo" className="w-full" />
                    </div>
                </div>

                <DataTable
                    value={loading ? SKELETON_ROWS : tournaments}
                    dataKey="id"
                    paginator={!loading && tournaments.length > 10}
                    rows={10}
                    emptyMessage={<EmptyState icon="pi-trophy" title={hasFilters ? 'Ningún torneo coincide con los filtros.' : 'No hay torneos registrados.'} />}
                >
                    <Column header="Nombre" body={nameBody} />
                    <Column header="Deporte" body={sportBody} />
                    <Column header="Fechas" body={datesBody} />
                    <Column header="Inscripciones" body={registrationBody} />
                    <Column header="Estado" body={statusBody} />
                    <Column header="Equipos" body={registrationsBody} />
                    <Column header="Fases" body={phasesBody} />
                    <Column header="Activo" body={activeBody} />
                    {hasActions && <Column header="Acciones" body={actionsBody} headerClassName="w-12rem" />}
                </DataTable>
            </div>

            <TournamentFormDialog visible={dialog.kind === 'form'} tournament={dialog.tournament} sports={sports} canListSports={canListSports} onHide={closeDialog} onSubmit={handleSubmit} />
            <TournamentStatusDialog visible={dialog.kind === 'status'} tournament={dialog.tournament} onHide={closeDialog} onSubmit={handleStatus} />
        </>
    );
}
