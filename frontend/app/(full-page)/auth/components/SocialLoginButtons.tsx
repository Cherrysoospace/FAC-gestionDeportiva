import { Button } from 'primereact/button';
import { SocialProvider } from '../hooks/useSocialLogin';
import styles from './auth.module.scss';

interface SocialLoginButtonsProps {
    loadingProvider: SocialProvider | null;
    disabled?: boolean;
    onSelect: (provider: SocialProvider) => void;
}

const PROVIDERS: { id: SocialProvider; label: string; icon: string }[] = [
    { id: 'google', label: 'Google', icon: 'pi pi-google' },
    { id: 'github', label: 'GitHub', icon: 'pi pi-github' },
    { id: 'discord', label: 'Discord', icon: 'pi pi-discord' }
];

export default function SocialLoginButtons({ loadingProvider, disabled = false, onSelect }: SocialLoginButtonsProps) {
    return (
        <>
            <div className={styles.divider}>o continúa con</div>
            <div className={styles.socialGrid}>
                {PROVIDERS.map((provider) => (
                    <Button
                        key={provider.id}
                        type="button"
                        label={provider.label}
                        icon={provider.icon}
                        outlined
                        severity="secondary"
                        className="w-full justify-content-center"
                        aria-label={`Continuar con ${provider.label}`}
                        loading={loadingProvider === provider.id}
                        disabled={disabled}
                        onClick={() => onSelect(provider.id)}
                    />
                ))}
            </div>
        </>
    );
}
