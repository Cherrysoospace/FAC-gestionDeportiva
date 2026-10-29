import React from 'react';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';
import { useAuth } from './context/authcontext';
import { APP_MODULES, AppModule, canAccessModule } from '@/lib/navigation';

const toMenuItem = (module: AppModule, visible: boolean): AppMenuItem => ({
    label: module.label,
    icon: `pi pi-fw ${module.icon}`,
    to: module.to,
    visible
});

const AppMenu = () => {
    const { hasPermissionUrl } = useAuth();

    const sectionItems = (section: AppModule['section']) =>
        APP_MODULES.filter((module) => module.section === section).map((module) => toMenuItem(module, canAccessModule(module, hasPermissionUrl)));

    const securityItems = sectionItems('Seguridad');
    const accountItems = sectionItems('Cuenta');

    const model: AppMenuItem[] = [
        {
            label: 'Inicio',
            items: [{ label: 'Inicio', icon: 'pi pi-fw pi-home', to: '/' }]
        },
        {
            label: 'Seguridad',
            visible: securityItems.some((item) => item.visible),
            items: securityItems
        },
        {
            label: 'Mi cuenta',
            items: accountItems
        }
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
