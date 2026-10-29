import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { useAuth } from './context/authcontext';
import BrandLogo from '@/components/ui/BrandLogo';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const { logout, user } = useAuth();
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo" aria-label="Ir al inicio">
                <BrandLogo showName />
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle} aria-label="Mostrar u ocultar el menú">
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar} aria-label="Más opciones">
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <Link href="/perfil" className="p-link layout-topbar-button" title="Mi perfil" aria-label="Mi perfil">
                    <i className="pi pi-user"></i>
                    <span>{user?.name ?? 'Mi perfil'}</span>
                </Link>
                <button type="button" className="p-link layout-topbar-button" onClick={() => void logout()} title="Cerrar sesión" aria-label="Cerrar sesión">
                    <i className="pi pi-sign-out"></i>
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
