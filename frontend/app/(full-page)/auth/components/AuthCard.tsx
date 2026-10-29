/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useContext } from 'react';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '@/layout/context/layoutcontext';

interface AuthCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

// Marco común de las pantallas públicas de autenticación (logo + tarjeta centrada).
export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
    const { layoutConfig } = useContext(LayoutContext);

    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`} alt="Logo" className="mb-5 w-6rem flex-shrink-0" />
                <div className="surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '24px', width: 'min(90vw, 32rem)' }}>
                    <div className="text-center mb-5">
                        <div className="text-900 text-3xl font-medium mb-3">{title}</div>
                        {subtitle && <span className="text-600 font-medium">{subtitle}</span>}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
