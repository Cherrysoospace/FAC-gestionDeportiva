import { classNames } from 'primereact/utils';
import styles from './ui.module.scss';

export const APP_NAME = 'FAC Gestión Deportiva';
export const APP_TAGLINE = 'Organización de torneos y eventos deportivos';

interface BrandLogoProps {
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
    className?: string;
}

/** Logo de la aplicación: un balón que toma el color primario del tema activo. */
export default function BrandLogo({ size = 'md', showName = false, className }: BrandLogoProps) {
    return (
        <span className={classNames(styles.brand, className)}>
            <svg viewBox="0 0 48 48" className={classNames(styles.brandMark, styles[`brandMark-${size}`])} role="img" aria-label={showName ? undefined : APP_NAME} aria-hidden={showName ? true : undefined}>
                <circle cx="24" cy="24" r="22" className={styles.brandBall} />
                <path d="M24 14l8.5 6.2-3.2 10H18.7l-3.2-10z" className={styles.brandPatch} />
                <path d="M24 14V4M32.5 20.2l9.3-3M29.3 30.2l5.8 8.1M18.7 30.2l-5.8 8.1M15.5 20.2l-9.3-3" className={styles.brandSeam} />
            </svg>
            {showName && (
                <span className={styles.brandName}>
                    <strong>FAC</strong> <span className={styles.brandNameLong}>Gestión Deportiva</span>
                </span>
            )}
        </span>
    );
}
