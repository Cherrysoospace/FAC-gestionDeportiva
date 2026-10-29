import { Avatar } from 'primereact/avatar';
import { classNames } from 'primereact/utils';
import { resolveApiUrl } from '@/lib/api';
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

    if (photoUrl) {
        return <Avatar image={resolveApiUrl(photoUrl)} shape="circle" className={classNames(sizeClass, className)} imageAlt={`Foto de ${name}`} />;
    }

    return <Avatar label={getInitials(name)} shape="circle" className={classNames(sizeClass, styles.profileAvatarInitials, className)} aria-label={`Iniciales de ${name}`} />;
}
