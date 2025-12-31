import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { parsePbError } from '~/lib/error-parser';

interface SiteSettings {
    id?: string;
    site_name: string;
    site_description: string;
    contact_email: string;
    maintenance_mode: boolean;
}

export default component$(() => {
    const settings = useSignal<SiteSettings | null>(null);
    const isLoading = useSignal(true);
    const isSaving = useSignal(false);
    const error = useSignal<string | null>(null);
    const success = useSignal(false);

    const fetchSettings = $(async () => {
        isLoading.value = true;
        try {
            // We assume there's only one record in 'site_settings'
            const records = await pbAdmin.collection('site_settings').getFullList<SiteSettings>({
                limit: 1,
                requestKey: null
            });

            if (records.length > 0) {
                settings.value = records[0];
            } else {
                // Default fallback or empty
                settings.value = {
                    site_name: 'JudoOK',
                    site_description: 'Database premium delle tecniche di Judo',
                    contact_email: '',
                    maintenance_mode: false
                };
            }
        } catch (err: any) {
            console.error('[Settings] Fetch failure:', err);
            // If collection doesn't exist, we'll show a helpful error later
            error.value = 'Nota: La collezione `site_settings` non è stata ancora creata in PocketBase.';
        } finally {
            isLoading.value = false;
        }
    });

    useVisibleTask$(() => {
        fetchSettings();
    });

    const handleSubmit = $(async (e: Event) => {
        e.preventDefault();
        isSaving.value = true;
        error.value = null;
        success.value = false;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = {
            site_name: formData.get('site_name') as string,
            site_description: formData.get('site_description') as string,
            contact_email: formData.get('contact_email') as string,
            maintenance_mode: formData.get('maintenance_mode') === 'on'
        };

        try {
            if (settings.value?.id) {
                await pbAdmin.collection('site_settings').update(settings.value.id, data);
            } else {
                const newRecord = await pbAdmin.collection('site_settings').create(data) as any as SiteSettings;
                settings.value = newRecord;
            }
            success.value = true;
            setTimeout(() => success.value = false, 3000);
        } catch (err: any) {
            error.value = parsePbError(err);
        } finally {
            isSaving.value = false;
        }
    });

    return (
        <div class="space-y-10 animate-in fade-in duration-700">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Impostazioni Sistema</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Configura i parametri globali del Dojo digitale.</p>
            </header>

            {error.value && (
                <div class="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-3xl text-amber-800 dark:text-amber-300">
                    <div class="flex items-center gap-3 mb-2 font-black uppercase text-xs tracking-widest">
                        <span>⚠️ Attenzione</span>
                    </div>
                    <p class="text-sm font-medium">{error.value}</p>
                    {!settings.value?.id && (
                        <div class="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800/50">
                            <p class="text-[10px] uppercase font-black opacity-60 mb-2">Schema Suggerito:</p>
                            <code class="block p-3 bg-black/5 dark:bg-white/5 rounded-xl text-[10px] font-mono whitespace-pre">
                                Collection: site_settings{"\n"}
                                - site_name (text, non-empty){"\n"}
                                - site_description (text){"\n"}
                                - contact_email (email){"\n"}
                                - maintenance_mode (bool)
                            </code>
                        </div>
                    )}
                </div>
            )}

            {success.value && (
                <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-3 animate-in zoom-in duration-300">
                    <span>✅</span> Impostazioni salvate con successo!
                </div>
            )}

            <div class={`bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm transition-opacity ${isLoading.value ? 'opacity-50 pointer-events-none' : ''}`}>
                <form onSubmit$={handleSubmit} class="space-y-8 max-w-2xl">
                    <div class="space-y-6">
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nome del Sito</label>
                            <input
                                type="text"
                                name="site_name"
                                required
                                value={settings.value?.site_name}
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                            />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Meta Description</label>
                            <textarea
                                name="site_description"
                                rows={4}
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-medium"
                            >{settings.value?.site_description}</textarea>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email di Contatto</label>
                                <input
                                    type="email"
                                    name="contact_email"
                                    value={settings.value?.contact_email}
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                                />
                            </div>
                            <div class="flex items-center gap-4 pt-6">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="maintenance_mode"
                                        checked={settings.value?.maintenance_mode}
                                        class="sr-only peer"
                                    />
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                                </label>
                                <span class="text-xs font-black text-gray-400 uppercase tracking-widest">Modalità Manutenzione</span>
                            </div>
                        </div>
                    </div>

                    <div class="pt-8 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="submit"
                            disabled={isSaving.value || isLoading.value}
                            class="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSaving.value ? 'Salvataggio...' : 'Salva Impostazioni'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});
