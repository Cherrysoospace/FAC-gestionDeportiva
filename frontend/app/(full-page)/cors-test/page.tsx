'use client';

// ARCHIVO TEMPORAL DE PRUEBA: eliminar cuando CORS esté verificado

import { useState } from 'react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8181').replace(/\/$/, '');

type CheckResult = {
    name: string;
    ok: boolean;
    status: string;
    body: string;
    error?: string;
};

async function readResponse(response: Response): Promise<{ status: string; body: string }> {
    const body = await response.text();
    return {
        status: `${response.status} ${response.statusText}`.trim(),
        body: body.slice(0, 200) || '(respuesta vacía)'
    };
}

export default function CorsTestPage() {
    const [origin, setOrigin] = useState(typeof window === 'undefined' ? '' : window.location.origin);
    const [results, setResults] = useState<CheckResult[]>([]);
    const [summary, setSummary] = useState('');
    const [running, setRunning] = useState(false);

    const runTest = async () => {
        setRunning(true);
        setResults([]);
        setSummary('');
        setOrigin(window.location.origin);

        const checks: CheckResult[] = [];
        let serverReachable = false;

        try {
            const response = await fetch(`${API_URL}/api/users`, { mode: 'no-cors' });
            serverReachable = response.type === 'opaque' || response.ok || response.status > 0;
            checks.push({
                name: 'Alcance del servidor',
                ok: serverReachable,
                status: response.type === 'opaque' ? 'respuesta opaca (no-cors)' : `${response.status} ${response.statusText}`.trim(),
                body: response.type === 'opaque' ? '(cuerpo no legible por no-cors)' : (await response.text()).slice(0, 200)
            });
        } catch {
            checks.push({
                name: 'Alcance del servidor',
                ok: false,
                status: 'sin respuesta',
                body: 'El backend no responde: levántalo o revisa el puerto',
                error: 'El backend no responde: levántalo o revisa el puerto'
            });
        }
        setResults([...checks]);

        if (serverReachable) {
            try {
                const response = await fetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        Authorization: 'Bearer cors-test',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: 'cors-test@example.com', password: 'cors-test' })
                });
                const details = await readResponse(response);
                checks.push({ name: 'Preflight sobre ruta pública', ok: true, ...details });
            } catch (error) {
                checks.push({
                    name: 'Preflight sobre ruta pública',
                    ok: false,
                    status: 'sin respuesta legible',
                    body: 'Failed to fetch',
                    error: error instanceof TypeError ? 'Failed to fetch' : String(error)
                });
            }
            setResults([...checks]);

            try {
                const response = await fetch(`${API_URL}/api/users`, {
                    headers: { Authorization: 'Bearer cors-test' }
                });
                const details = await readResponse(response);
                checks.push({ name: 'Preflight sobre ruta protegida', ok: true, ...details });
            } catch (error) {
                checks.push({
                    name: 'Preflight sobre ruta protegida',
                    ok: false,
                    status: 'sin respuesta legible',
                    body: 'Failed to fetch',
                    error: error instanceof TypeError ? 'Failed to fetch' : String(error)
                });
            }
            setResults([...checks]);
        }

        const publicCheck = checks[1];
        const protectedCheck = checks[2];
        if (!serverReachable) {
            setSummary('No se pudo comprobar CORS porque el backend no es alcanzable.');
        } else if (publicCheck?.ok && protectedCheck?.ok) {
            setSummary('CORS bien configurado: el navegador puede leer las respuestas del backend.');
        } else if (
            publicCheck?.error === 'Failed to fetch' ||
            protectedCheck?.error === 'Failed to fetch'
        ) {
            setSummary('El backend responde pero el navegador bloquea la petición: CORS mal configurado o el preflight está siendo rechazado por la autorización.');
        } else {
            setSummary('El backend respondió, pero una comprobación no pudo completarse.');
        }
        setRunning(false);
    };

    return (
        <main style={{ maxWidth: 800, margin: '3rem auto', padding: '0 1rem', fontFamily: 'Arial, sans-serif' }}>
            <h1>Prueba de CORS (vista temporal)</h1>
            <p>Origen del navegador: {origin || '(se mostrará al ejecutar la prueba)'}</p>
            <p>Backend probado: {API_URL}</p>
            <button type="button" onClick={runTest} disabled={running}>
                {running ? 'Ejecutando...' : 'Ejecutar prueba'}
            </button>

            <section aria-live="polite">
                {results.map((result) => (
                    <div key={result.name} style={{ marginTop: '1.5rem' }}>
                        <h2 style={{ color: result.ok ? 'green' : 'crimson' }}>
                            {result.ok ? 'OK' : 'FALLO'} - {result.name}
                        </h2>
                        <p>Estado HTTP: {result.status}</p>
                        <p>Respuesta: {result.body}</p>
                    </div>
                ))}
                {summary && <p style={{ marginTop: '2rem', fontWeight: 'bold' }}>{summary}</p>}
            </section>
        </main>
    );
}
