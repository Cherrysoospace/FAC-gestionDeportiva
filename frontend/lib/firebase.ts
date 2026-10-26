import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const missingVariables = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingVariables.length > 0) {
    throw new Error(
        `Faltan variables de entorno de Firebase: ${missingVariables.join(', ')}`
    );
}

const app = getApps()[0] ?? initializeApp(firebaseConfig);

export const auth = getAuth(app);
