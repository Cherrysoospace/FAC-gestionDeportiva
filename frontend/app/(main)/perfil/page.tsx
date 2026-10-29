'use client';

import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import PageHeader from '@/components/ui/PageHeader';
import { PersonalDataInput } from '@/types/profile';
import PersonalDataForm from '@/components/profile/PersonalDataForm';
import ProfilePhotoCard from './components/ProfilePhotoCard';
import { ActionResult } from '@/types/action';
import { useMyProfile } from './hooks/useMyProfile';

export default function MyProfilePage() {
    const toast = useRef<Toast>(null);
    const { profile, loading, loadError, saving, photoBusy, savePersonalData, uploadPhoto, removePhoto, reload } = useMyProfile();

    const notify = (result: ActionResult, successText: string) => {
        toast.current?.show(
            result.ok
                ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 }
                : { severity: 'error', summary: 'No se pudo completar', detail: result.error, life: 5000 }
        );
    };

    const handleSave = async (data: PersonalDataInput) => notify(await savePersonalData(data), 'Tus datos se guardaron.');
    const handleUpload = async (file: File) => notify(await uploadPhoto(file), 'Tu foto se actualizó.');
    const handleRemove = () =>
        confirmDialog({
            header: 'Quitar foto',
            message: '¿Seguro que quieres quitar tu foto de perfil?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Quitar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => notify(await removePhoto(), 'Tu foto se quitó.')
        });

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader title="Mi perfil" subtitle="Mantén actualizados tus datos personales" breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Mi perfil' }]} />
            </div>

            {loadError && (
                <div className="col-12">
                    <Message severity="error" text={loadError} className="w-full mb-3" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            {loading && !profile && (
                <>
                    <div className="col-12 lg:col-4">
                        <Skeleton height="20rem" />
                    </div>
                    <div className="col-12 lg:col-8">
                        <Skeleton height="20rem" />
                    </div>
                </>
            )}

            {profile && (
                <>
                    <div className="col-12 lg:col-4">
                        <ProfilePhotoCard profile={profile} busy={photoBusy} onUpload={handleUpload} onRemove={handleRemove} />
                    </div>
                    <div className="col-12 lg:col-8">
                        <PersonalDataForm profile={profile} saving={saving} onSave={handleSave} />
                    </div>
                </>
            )}
        </div>
    );
}
