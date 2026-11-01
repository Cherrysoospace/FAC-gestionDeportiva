'use client';

import { useRouter } from 'next/navigation';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { resolveApiUrl } from '@/lib/api';
import { getInitials } from '@/lib/format';
import { useAuth } from './context/authcontext';

// Bloque del usuario en la barra superior: foto, nombre y rol, con un menú
// para ir al perfil o cerrar sesión. Se muestra en todas las pantallas.
export default function TopbarUserMenu() {
    const router = useRouter();
    const { user, roles, photoUrl, logout } = useAuth();
    const menu = useRef<Menu>(null);
    const [photoFailed, setPhotoFailed] = useState(false);

    // Si cambia la foto (se subió otra), se vuelve a intentar mostrarla
    useEffect(() => setPhotoFailed(false), [photoUrl]);

    const name = user?.name ?? '';
    const roleLabel = useMemo(() => {
        const activeRoles = roles.filter((role) => role.active !== false).map((role) => role.name);
        return activeRoles.length > 0 ? activeRoles.join(', ') : 'Sin rol asignado';
    }, [roles]);

    const items: MenuItem[] = [
        { label: 'Mi perfil', icon: 'pi pi-user', command: () => router.push('/perfil') },
        { separator: true },
        { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => void logout() }
    ];

    if (!user) {
        return null;
    }

    const showPhoto = Boolean(photoUrl) && !photoFailed;

    return (
        <>
            <button
                type="button"
                className="p-link layout-topbar-user"
                onClick={(event) => menu.current?.toggle(event)}
                aria-haspopup="menu"
                aria-controls="topbar-user-menu"
                aria-label={`Opciones de ${name}`}
                title={`${name} · ${roleLabel}`}
            >
                {showPhoto ? (
                    <Avatar image={resolveApiUrl(photoUrl as string)} imageAlt={`Foto de ${name}`} onImageError={() => setPhotoFailed(true)} shape="circle" className="layout-topbar-user-avatar" />
                ) : (
                    <Avatar label={getInitials(name)} shape="circle" className="layout-topbar-user-avatar layout-topbar-user-initials" aria-hidden="true" />
                )}
                <span className="layout-topbar-user-text">
                    <span className="layout-topbar-user-name">{name}</span>
                    <span className="layout-topbar-user-role">{roleLabel}</span>
                </span>
                <i className="pi pi-chevron-down layout-topbar-user-chevron" aria-hidden="true" />
            </button>
            <Menu id="topbar-user-menu" ref={menu} model={items} popup />
        </>
    );
}
