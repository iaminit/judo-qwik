import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import { loginAdmin, pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
    const nav = useNavigate();
    const error = useSignal<string | null>(null);
    const loading = useSignal(false);

    // Check if already logged in
    useVisibleTask$(() => {
        const authStore = pbAdmin.authStore as any;
        if (authStore.isValid && (authStore.isSuperuser || authStore.record?.collectionName === '_superusers')) {
            nav('/gestione');
        }
    });

    const handleSubmit = $((e: Event) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        loading.value = true;
        error.value = null;

        setTimeout(async () => {
            try {
                const result = await loginAdmin(email, password);
                if (result.success) {
                    nav('/gestione');
                } else {
                    error.value = result.error || 'Credenziali non valide';
                }
            } catch (err: any) {
                error.value = err.message || 'Errore di connessione';
            } finally {
                loading.value = false;
            }
        }, 500); // Small delay for UX feel
    });

    return (
        <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 font-sans">
            <div class="max-w-md w-full">
                {/* Logo / Header */}
                <div class="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-500/20 mb-6">
                        <span class="text-4xl font-black">J</span>
                    </div>
                    <h1 class="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        JudoOK Gestione
                    </h1>
                    <p class="mt-3 text-gray-500 dark:text-gray-400 font-medium">
                        Accedi al pannello di controllo
                    </p>
                </div>

                {/* Login Card */}
                <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-black/5 border border-gray-100 dark:border-gray-800 p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                    {error.value && (
                        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in zoom-in-95">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                            <span class="text-sm font-semibold">{error.value}</span>
                        </div>
                    )}

                    <form preventdefault:submit onSubmit$={handleSubmit} class="space-y-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">
                                Email Amministratore
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="nome@esempio.it"
                                class="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white placeholder:text-gray-400"
                            />
                        </div>

                        <div>
                            <div class="flex justify-between items-center mb-2 px-1">
                                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <a href="#" class="text-xs font-bold text-red-600 hover:text-red-700 transition-colors">
                                    Dimenticata?
                                </a>
                            </div>
                            <input
                                type="password"
                                name="password"
                                required
                                placeholder="••••••••"
                                class="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white placeholder:text-gray-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading.value}
                            class="w-full py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-black font-black text-lg rounded-xl shadow-xl shadow-black/10 hover:transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3"
                        >
                            {loading.value ? (
                                <>
                                    <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Accesso in corso...
                                </>
                            ) : (
                                'Entra nel Dojo'
                            )}
                        </button>
                    </form>

                    <div class="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <p class="text-center text-xs text-gray-400 uppercase tracking-widest font-bold">
                            Accesso Protetto
                        </p>
                        <div class="flex justify-center gap-6 mt-4 grayscale opacity-50">
                            <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-400">G</div>
                            <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-400">M</div>
                            <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-400">F</div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p class="mt-8 text-center text-sm text-gray-500 dark:text-gray-600 font-medium">
                    &copy; {new Date().getFullYear()} JudoOK. All rights reserved.
                </p>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Accedi - JudoOK Gestione',
    meta: [
        {
            name: 'description',
            content: 'Accesso riservato agli amministratori di JudoOK',
        },
        {
            name: 'robots',
            content: 'noindex, nofollow'
        }
    ],
};
