import { useEffect, useState } from 'react';
import { Avatar } from 'primereact/avatar';
import { classNames } from 'primereact/utils';
import AvatarPhoto from './AvatarPhoto';
import { getInitials } from '@/lib/format';
import styles from './ui.module.scss';

interface ProfileAvatarProps {
    name: string;
    photoUrl?: string | null;
    size?: 'lg' | 'xl';
    className?: string;
}

// Avatar grande de perfil: muestra la foto si existe, si no las iniciales del nombre.
export default function ProfileAvatar({ name, photoUrl, size = 'lg', className }: ProfileAvatarProps) {
    const sizeClass = size === 'xl' ? styles.profileAvatarXl : styles.profileAvatarLg;
    // Si la foto no carga (enlace vencido, bloqueo del proveedor...) se muestran las iniciales
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [photoUrl]);

    if (photoUrl && !failed) {
        return <AvatarPhoto photoUrl={photoUrl} alt={`Foto de ${name}`} onError={() => setFailed(true)} className={classNames(sizeClass, className)} />;
    }

    return <Avatar label={getInitials(name)} shape="circle" className={classNames(sizeClass, styles.profileAvatarInitials, className)} aria-label={`Iniciales de ${name}`} />;
}
