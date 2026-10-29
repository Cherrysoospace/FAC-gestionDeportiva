'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { BreadCrumb } from 'primereact/breadcrumb';
import { MenuItem } from 'primereact/menuitem';
import styles from './ui.module.scss';

export interface BreadcrumbEntry {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumb?: BreadcrumbEntry[];
    actions?: ReactNode;
}

function toMenuItem({ label, href }: BreadcrumbEntry): MenuItem {
    if (!href) {
        return { label };
    }

    return {
        label,
        template: () => (
            <Link href={href} className="p-menuitem-link">
                <span className="p-menuitem-text">{label}</span>
            </Link>
        )
    };
}

export default function PageHeader({
    title,
    subtitle,
    breadcrumb,
    actions
}: PageHeaderProps) {
    return (
        <div className="card mb-4">
            {breadcrumb && breadcrumb.length > 0 && (
                <BreadCrumb
                    model={breadcrumb.map(toMenuItem)}
                    className={styles.breadcrumb}
                    aria-label="Ruta de navegación"
                />
            )}
            <div className="flex flex-column md:flex-row md:align-items-start md:justify-content-between gap-3">
                <div className="flex flex-column gap-1">
                    <h2 className="m-0">{title}</h2>
                    {subtitle && <p className="text-600 m-0">{subtitle}</p>}
                </div>
                {actions}
            </div>
        </div>
    );
}
