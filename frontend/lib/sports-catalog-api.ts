import { sportsApiFetch, toQueryString } from './sports-api';
import { Sport, SportQuery } from '@/types/sports';

// Catálogo de deportes de ms-sports (para los selectores de deporte).
export function listSports(query: SportQuery = {}, signal?: AbortSignal): Promise<Sport[]> {
    return sportsApiFetch<Sport[]>(`/sports${toQueryString({ ...query })}`, { signal });
}
