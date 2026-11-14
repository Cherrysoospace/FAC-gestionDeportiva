'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { isValidationError, TournamentActionResult } from '@/lib/tournament-form';
import { createTournament, deleteTournament, listTournaments, updateTournament } from '@/lib/tournaments-api';
import { CreateTournamentPayload, Tournament, TournamentStatus, UpdateTournamentPayload } from '@/types/sports';

export interface TournamentFilters {
    search: string;
    sportId: number | null;
    status: TournamentStatus | null;
    active: boolean | null;
}

export async function runTournamentAction(action: () => Promise<void>): Promise<TournamentActionResult> {
    try {
        await action();
        return { ok: true };
    } catch (cause) {
        return { ok: false, error: describeError(cause), validation: isValidationError(cause) };
    }
}

// Los filtros se aplican en ms-sports (GET /tournaments?search&sportId&status&active).
export function useTournaments({ search, sportId, status, active }: TournamentFilters) {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        listTournaments(
            {
                search: search.trim() || undefined,
                sportId: sportId ?? undefined,
                status: status ?? undefined,
                active: active ?? undefined
            },
            controller.signal
        )
            .then(setTournaments)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [search, sportId, status, active, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    // Reemplaza la fila en su lugar para no perder el orden del backend
    const replaceLocal = useCallback((saved: Tournament) => {
        setTournaments((current) => current.map((tournament) => (tournament.id === saved.id ? saved : tournament)));
    }, []);

    // Al crear se recarga: el torneo nuevo puede no cumplir los filtros actuales
    const create = useCallback(
        (payload: CreateTournamentPayload) =>
            runTournamentAction(async () => {
                await createTournament(payload);
                reload();
            }),
        [reload]
    );

    const update = useCallback((id: number, payload: UpdateTournamentPayload) => runTournamentAction(async () => replaceLocal(await updateTournament(id, payload))), [replaceLocal]);

    const changeStatus = useCallback((id: number, next: TournamentStatus) => update(id, { status: next }), [update]);

    const remove = useCallback(
        (id: number) =>
            runTournamentAction(async () => {
                await deleteTournament(id);
                setTournaments((current) => current.filter((tournament) => tournament.id !== id));
            }),
        []
    );

    return { tournaments, loading, error, reload, create, update, changeStatus, remove };
}
