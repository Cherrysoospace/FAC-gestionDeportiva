import { confirmDialog } from 'primereact/confirmdialog';
import { UserAccount } from '@/types/security';

// HU-SE-01: desactivar no borra al usuario; se pide confirmación igual porque cierra sus sesiones.
export function confirmUserStatusChange(user: UserAccount, enabled: boolean, onAccept: () => void) {
    confirmDialog({
        header: enabled ? 'Reactivar usuario' : 'Desactivar usuario',
        message: enabled
            ? `¿Reactivar a ${user.name}? Podrá volver a iniciar sesión.`
            : `¿Desactivar a ${user.name}? No podrá iniciar sesión y se cerrarán sus sesiones abiertas. Sus roles y datos se conservan.`,
        icon: enabled ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle',
        acceptLabel: enabled ? 'Reactivar' : 'Desactivar',
        rejectLabel: 'Cancelar',
        acceptClassName: enabled ? undefined : 'p-button-danger',
        accept: onAccept
    });
}
