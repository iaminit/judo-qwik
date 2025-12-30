import { component$ } from '@builder.io/qwik';

export default component$(() => {
    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Impostazioni Sistema</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Configura i parametri globali del sito.</p>
            </header>

            <div class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                <div class="space-y-8 max-w-2xl">
                    <div class="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-800/30 text-yellow-800 dark:text-yellow-300">
                        <p class="font-bold flex items-center gap-2">
                            <span>🏗️</span> In Sviluppo
                        </p>
                        <p class="text-sm mt-1">Le impostazioni globali sono attualmente gestite direttamente tramite il pannello di controllo PocketBase.</p>
                    </div>

                    <div class="space-y-4 opacity-50 pointer-events-none">
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nome Sito</label>
                            <input type="text" value="JudoOK" class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold" />
                        </div>
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Meta Description</label>
                            <textarea class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-medium h-32">Database premium delle tecniche di Judo...</textarea>
                        </div>
                    </div>

                    <div class="pt-6 border-t border-gray-100 dark:border-gray-800">
                        <a href="http://127.0.0.1:8090/_/" target="_blank" class="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl shadow-xl hover:scale-105 transition-all">
                            <span>Admin PocketBase</span>
                            <span class="text-xl">↗</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
});
