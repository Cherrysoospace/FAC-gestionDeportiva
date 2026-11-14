import { Tag } from 'primereact/tag';
import { TOURNAMENT_STATUS_LABELS, TOURNAMENT_STATUS_SEVERITY } from '@/lib/tournament-labels';
import { TournamentStatus } from '@/types/sports';

export function TournamentStatusTag({ status }: { status: TournamentStatus }) {
    return <Tag value={TOURNAMENT_STATUS_LABELS[status]} severity={TOURNAMENT_STATUS_SEVERITY[status]} />;
}

export function TournamentActiveTag({ active }: { active: boolean }) {
    return active ? <Tag value="Activo" severity="success" /> : <Tag value="Inactivo" severity="danger" />;
}
