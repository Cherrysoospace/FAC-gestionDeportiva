'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import Layout from '@/layout/layout';
import { useAuth } from '@/layout/context/authcontext';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/auth/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <Layout>{children}</Layout>;
}
