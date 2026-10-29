import { Metadata } from 'next';
import ProtectedLayout from './protected-layout';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'FAC Gestión Deportiva',
    description: 'Sistema para la organización de torneos y eventos deportivos.',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    icons: {
        icon: '/favicon.ico'
    }
};

export default function AppLayout({ children }: AppLayoutProps) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
