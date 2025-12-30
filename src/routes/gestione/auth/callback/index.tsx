import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
    const loc = useLocation();
    const nav = useNavigate();

    useVisibleTask$(async () => {
        const code = loc.url.searchParams.get('code');
        const state = loc.url.searchParams.get('state');

        const providerJson = localStorage.getItem('oauth_provider');
        if (!providerJson || !code) {
            nav('/gestione/login?error=invalid_callback');
            return;
        }

        const provider = JSON.parse(providerJson);
        const redirectUrl = `${window.location.origin}/gestione/auth/callback`;

        try {
            // Exchange code for local auth record
            // Note: This matches the 'users' collection auth flow
            const authData = await pbAdmin.collection('users').authWithOAuth2Code(
                provider.name,
                code,
                provider.codeVerifier,
                redirectUrl
            );

            // Check if user is admin
            if (authData.record.role !== 'admin') {
                pbAdmin.authStore.clear();
                nav('/gestione/login?error=Accesso negato: devi essere un amministratore.');
                return;
            }

            localStorage.removeItem('oauth_provider');
            nav('/gestione');
        } catch (err: any) {
            console.error('OAuth Error:', err);
            nav(`/gestione/login?error=${encodeURIComponent(err.message || 'Errore durante l\'autenticazione OAuth2')}`);
        }
    });

    return (
        <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div class="text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-500/20 mb-6 animate-bounce">
                    <span class="text-3xl font-black">J</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <p class="text-xl font-black text-gray-900 dark:text-white">Verifica in corso...</p>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Ti stiamo portando nel Dojo.</p>
                </div>
            </div>
        </div>
    );
});
