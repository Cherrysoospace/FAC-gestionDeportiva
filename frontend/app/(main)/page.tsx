'use client';

import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import QuickAccessGrid from './components/QuickAccessGrid';
import WelcomeCard from './components/WelcomeCard';
import { useHomeSummary } from './hooks/useHomeSummary';

export default function HomePage() {
    const { greeting, userName, email, roles, modules, loading, failed, retry } = useHomeSummary();

    return (
        <>
            <WelcomeCard greeting={greeting} userName={userName} email={email} roles={roles} loading={loading} />

            {failed && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="warn" text="No pudimos cargar tus permisos. Algunos accesos pueden no aparecer." className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={retry} />
                </div>
            )}

            <section className="card" aria-labelledby="quick-access-title">
                <h2 id="quick-access-title" className="text-900 text-xl font-semibold mt-0 mb-1">
                    Accesos rápidos
                </h2>
                <p className="text-600 mt-0 mb-4">Estos son los módulos que puedes usar según tus permisos.</p>
                <QuickAccessGrid modules={modules} loading={loading} />
            </section>
        </>
    );
}
