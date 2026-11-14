import { sportsApiFetch, toQueryString } from './sports-api';
import { CreateTournamentPayload, MessageResponse, Tournament, TournamentQuery, UpdateTournamentPayload } from '@/types/sports';

const TOURNAMENTS = '/tournaments';

export function listTournaments(query: TournamentQuery = {}, signal?: AbortSignal): Promise<Tournament[]> {
    return sportsApiFetch<Tournament[]>(`${TOURNAMENTS}${toQueryString({ ...query })}`, { signal });
}

export function getTournament(id: number, signal?: AbortSignal): Promise<Tournament> {
    return sportsApiFetch<Tournament>(`${TOURNAMENTS}/${id}`, { signal });
}

export function createTournament(payload: CreateTournamentPayload): Promise<Tournament> {
    return sportsApiFetch<Tournament>(TOURNAMENTS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateTournament(id: number, payload: UpdateTournamentPayload): Promise<Tournament> {
    return sportsApiFetch<Tournament>(`${TOURNAMENTS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

export function deleteTournament(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${TOURNAMENTS}/${id}`, { method: 'DELETE' });
}
