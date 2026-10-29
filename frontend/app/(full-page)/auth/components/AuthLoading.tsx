import { ProgressSpinner } from 'primereact/progressspinner';
import styles from './auth.module.scss';

interface AuthLoadingProps {
    message?: string;
}

// Pantalla completa de espera para las rutas públicas (Suspense, callbacks OAuth).
export default function AuthLoading({ message = 'Cargando…' }: AuthLoadingProps) {
    return (
        <main className={`auth-background ${styles.screen} flex-column gap-3`} role="status" aria-live="polite">
            <ProgressSpinner className="w-3rem h-3rem" strokeWidth="4" aria-hidden="true" />
            <span className="text-700">{message}</span>
        </main>
    );
}
