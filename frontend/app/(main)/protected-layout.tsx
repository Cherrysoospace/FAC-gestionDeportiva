'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import Layout from '@/layout/layout';
import { useAuth } from '@/layout/context/authcontext';
import LoadingState from '@/components/ui/LoadingState';

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
        return <LoadingState fullScreen message="Verificando tu sesión…" />;
    }

    if (!isAuthenticated) {
        return null;
    }

    return <Layout>{children}</Layout>;
}
