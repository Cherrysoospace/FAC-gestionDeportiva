import { Avatar, AvatarProps } from 'primereact/avatar';
import { classNames } from 'primereact/utils';
import { resolveApiUrl } from '@/lib/api';

interface AvatarPhotoProps {
    photoUrl: string;
    alt: string;
    size?: AvatarProps['size'];
    className?: string;
    onError?: () => void;
}

/**
 * Foto de perfil en un avatar redondo.
 * Usa su propio <img> con referrerPolicy="no-referrer": las fotos de Google
 * (lh3.googleusercontent.com) responden 403 si la petición lleva el Referer
 * de localhost u otro dominio, y el Avatar de PrimeReact no permite quitarlo.
 */
export default function AvatarPhoto({ photoUrl, alt, size, className, onError }: AvatarPhotoProps) {
    return (
        <Avatar shape="circle" size={size} className={classNames('overflow-hidden', className)}>
            <img src={resolveApiUrl(photoUrl)} alt={alt} referrerPolicy="no-referrer" onError={onError} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Avatar>
    );
}
