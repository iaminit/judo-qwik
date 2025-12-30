import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export default component$(() => {
    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Community Admin</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestisci gli aspetti sociali e i membri del Dojo.</p>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                    <h3 class="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="text-2xl">📰</span>
                        Archivio Post
                    </h3>
                    <p class="text-gray-500 dark:text-gray-400 mb-6 font-medium">Visualizza e gestisci tutti i post storici della community (gli avvisi scaduti).</p>
                    <Link href="/gestione/bacheca" class="inline-flex items-center gap-2 font-black text-purple-600 hover:gap-3 transition-all">
                        Vai alla Gestione Post &rarr;
                    </Link>
                </div>

                <div class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm opacity-60">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <span class="text-2xl">👥</span>
                            Membri
                        </h3>
                        <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-[8px] font-black uppercase tracking-widest rounded text-gray-400">Prossimamente</span>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 mb-6 font-medium">La gestione degli utenti e delle iscrizioni sarà disponibile nelle prossime versioni.</p>
                    <div class="h-10"></div>
                </div>
            </div>
        </div>
    );
});
