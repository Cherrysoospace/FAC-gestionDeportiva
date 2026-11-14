'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { getTournament, updateTournament } from '@/lib/tournaments-api';
import { Tournament, TournamentStatus, UpdateTournamentPayload } from '@/types/sports';
import { runTournamentAction } from './useTournaments';

export function useTournamentDetail(tournamentId: number) {
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);

        getTournament(tournamentId, controller.signal)
            .then(setTournament)
            .catch((cause) => {
                if (!controller.signal.aborted) setLoadError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [tournamentId, reloadKey]);

    const update = useCallback((payload: UpdateTournamentPayload) => runTournamentAction(async () => setTournament(await updateTournament(tournamentId, payload))), [tournamentId]);

    const changeStatus = useCallback((next: TournamentStatus) => update({ status: next }), [update]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    return { tournament, loading, loadError, update, changeStatus, reload };
}
