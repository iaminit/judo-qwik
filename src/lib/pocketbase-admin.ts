import PocketBase from 'pocketbase';

// In Qwik, we should be careful with global instances if they hold state.
// But for the client-side/browser usage, a single instance is usually fine.
// For SSR, we might need a fresh instance per request.

const PB_URL = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';

export const pbAdmin = new PocketBase(PB_URL);

// Traditional Email/Password Login for Admins
export const loginAdmin = async (email: string, password: string) => {
    try {
        // Note: pb.admins is for PocketBase system admins.
        // If we use the 'users' collection with a 'role' field, we use pb.collection('users').
        // The POC suggests using pbAdmin.admins.authWithPassword for system admins.
        const authData = await pbAdmin.admins.authWithPassword(email, password);
        return { success: true, admin: (authData as any).admin };
    } catch (err: any) {
        return { success: false, error: err.message || 'Errore durante il login' };
    }
};

// OAuth2 Login (Frontend helper)
export const loginWithOAuth2 = async (provider: 'google' | 'microsoft' | 'facebook') => {
    try {
        const authMethods = await pbAdmin.collection('users').listAuthMethods();
        const providerConfig = ((authMethods as any).authProviders as any[]).find((p: any) => p.name === provider);

        if (!providerConfig) {
            return { success: false, error: `Provider ${provider} non configurato` };
        }

        const redirectUrl = `${window.location.origin}/gestione/auth/callback`;

        // We store the provider in localStorage to know which one to use in the callback
        localStorage.setItem('oauth_provider', JSON.stringify(providerConfig));

        // Redirect to provider
        window.location.href = providerConfig.authUrl + redirectUrl;

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Errore OAuth2' };
    }
};

export const isAdminAuthenticated = () => {
    const authStore = pbAdmin.authStore as any;
    return authStore.isValid && (authStore.isSuperuser || authStore.record?.collectionName === '_superusers' || authStore.model?.role === 'admin');
};

export const logoutAdmin = () => {
    pbAdmin.authStore.clear();
    if (typeof window !== 'undefined') {
        localStorage.removeItem('oauth_provider');
    }
};

export const getCurrentAdmin = () => {
    return pbAdmin.authStore.model;
};
