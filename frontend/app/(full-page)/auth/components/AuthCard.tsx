'use client';

import React, { useContext } from 'react';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '@/layout/context/layoutcontext';
import BrandLogo, { APP_NAME, APP_TAGLINE } from '@/components/ui/BrandLogo';
import styles from './auth.module.scss';

export type AuthCardTone = 'info' | 'warning' | 'danger';

interface AuthCardProps {
    title: string;
    subtitle?: string;
    /** Icono destacado sobre el título (pantallas de estado como acceso denegado o error). */
    icon?: string;
    tone?: AuthCardTone;
    children?: React.ReactNode;
}

// Marco común de las pantallas públicas: identidad del sistema + tarjeta centrada.
export default function AuthCard({ title, subtitle, icon, tone = 'info', children }: AuthCardProps) {
    const { layoutConfig } = useContext(LayoutContext);

    return (
        <main className={classNames('auth-background', styles.screen, { 'p-input-filled': layoutConfig.inputStyle === 'filled' })}>
            <div className={styles.wrapper}>
                <div className={styles.brandBlock}>
                    <BrandLogo size="lg" />
                    <span className="text-900 text-2xl font-bold">{APP_NAME}</span>
                    <span className="text-600">{APP_TAGLINE}</span>
                </div>
                <section className={styles.card} aria-labelledby="auth-card-title">
                    <div className="text-center mb-5">
                        {icon && (
                            <span className={classNames(styles.statusIcon, styles[`statusIcon-${tone}`])} aria-hidden="true">
                                <i className={`pi ${icon}`} />
                            </span>
                        )}
                        <h1 id="auth-card-title" className="text-900 text-3xl font-semibold mt-0 mb-2">
                            {title}
                        </h1>
                        {subtitle && <p className="text-600 m-0 line-height-3">{subtitle}</p>}
                    </div>
                    {children}
                </section>
            </div>
        </main>
    );
}
