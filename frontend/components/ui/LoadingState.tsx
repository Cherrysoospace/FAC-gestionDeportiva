import { ProgressSpinner } from 'primereact/progressspinner';
import { classNames } from 'primereact/utils';
import styles from './ui.module.scss';

interface LoadingStateProps {
    message?: string;
    /** Ocupa toda la pantalla (mientras se valida la sesión). */
    fullScreen?: boolean;
}

export default function LoadingState({ message = 'Cargando…', fullScreen = false }: LoadingStateProps) {
    return (
        <div className={classNames(styles.loadingState, { [styles.loadingStateFull]: fullScreen })} role="status" aria-live="polite">
            <ProgressSpinner className={styles.loadingSpinner} strokeWidth="4" aria-hidden="true" />
            <span className="text-600">{message}</span>
        </div>
    );
}
