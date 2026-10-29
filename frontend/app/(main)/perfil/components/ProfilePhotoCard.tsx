'use client';

import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import ProfileAvatar from '@/components/ui/ProfileAvatar';
import { authProviderLabel, PROFILE_PHOTO_ACCEPT } from '@/lib/profile-rules';
import { MyProfile } from '@/types/profile';

interface ProfilePhotoCardProps {
    profile: MyProfile;
    busy: boolean;
    onUpload: (file: File) => void;
    onRemove: () => void;
}

// Foto y datos de la cuenta. Nombre, correo y proveedor son de solo lectura.
export default function ProfilePhotoCard({ profile, busy, onUpload, onRemove }: ProfilePhotoCardProps) {
    const fileInput = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) onUpload(file);
    };

    return (
        <div className="card flex flex-column align-items-center text-center h-full">
            <ProfileAvatar name={profile.name} photoUrl={profile.photoUrl} size="xl" className="mb-3" />

            <div className="text-900 text-xl font-medium">{profile.name}</div>
            <div className="text-600 mb-2">{profile.email}</div>
            <Tag value={authProviderLabel(profile.authProvider)} icon="pi pi-lock" severity="info" className="mb-4" />

            <input ref={fileInput} type="file" accept={PROFILE_PHOTO_ACCEPT} className="hidden" onChange={handleFileChange} aria-label="Seleccionar foto de perfil" />
            <div className="flex flex-wrap gap-2 justify-content-center">
                <Button type="button" label={profile.photoUrl ? 'Cambiar foto' : 'Subir foto'} icon="pi pi-upload" loading={busy} onClick={() => fileInput.current?.click()} />
                {profile.photoUrl && <Button type="button" label="Quitar" icon="pi pi-trash" severity="danger" outlined disabled={busy} onClick={onRemove} />}
            </div>
            <small className="text-500 mt-3">JPG, PNG o WebP. Máximo 2 MB.</small>
        </div>
    );
}
