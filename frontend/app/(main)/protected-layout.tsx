'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import Layout from '@/layout/layout';
import { useAuth } from '@/layout/context/authcontext';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            const next = encodeURIComponent(pathname || '/');
            router.replace(`/auth/login?next=${next}`);
        }
    }, [isAuthenticated, isLoading, pathname, router]);

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
