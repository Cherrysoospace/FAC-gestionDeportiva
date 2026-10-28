import { getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isConfigured = Object.values(firebaseConfig).every(Boolean);

if (!isConfigured && typeof window !== 'undefined') {
    console.warn(
        'Firebase no está configurado: el login con Google estará deshabilitado.'
    );
}

const app = isConfigured
    ? (getApps()[0] ?? initializeApp(firebaseConfig))
    : null;

export const auth: Auth | null = app ? getAuth(app) : null;
