import { component$, useSignal, useComputed$, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';

interface Term {
    id: string;
    term: string;
    kanji: string;
    description: string;
    category: string;
    audio_url?: string;
    image_url?: string;
    long_description?: string;
}

export const useDictionaryData = routeLoader$(async () => {
    try {
        console.log('[Dictionary Prova] Fetching from PocketBase...');
        const records = await pb.collection('dictionary').getFullList({
            sort: 'term',
            requestKey: null,
        });

        return records.map((record: any) => {
            const normalizedName = record.term.toLowerCase()
                .replace(/ /g, '')
                .replace(/-/g, '')
                .replace(/ō/g, 'o')
                .replace(/ū/g, 'u')
                .replace(/ā/g, 'a')
                .replace(/ī/g, 'i')
                .replace(/ē/g, 'e');

            const pbAudio = record.audio ? pb.files.getUrl(record, record.audio) : null;
            const fallbackAudio = `/audio/${normalizedName}.mp3`;

            return {
                id: record.id,
                term: record.term,
                kanji: record.kanji || '',
                description: record.description || '',
                category: record.category || 'Generale',
                audio_url: pbAudio || fallbackAudio,
                long_description: record.long_description || record.description || ''
            };
        }) as Term[];
    } catch (err) {
        console.error('[Dictionary Prova] Error loading terms:', err);
        return [];
    }
});

export default component$(() => {
    const data = useDictionaryData();
    const searchQuery = useSignal('');
    const viewMode = useSignal<'list' | 'grid'>('list');
    const selectedTerm = useSignal<Term | null>(null);
    const isModalOpen = useSignal(false);

    const filteredTerms = useComputed$(() => {
        return data.value.filter(t =>
            t.term.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            t.kanji.includes(searchQuery.value)
        );
    });

    const openModal = $((term: Term) => {
        selectedTerm.value = term;
        isModalOpen.value = true;
    });

    const closeModal = $(() => {
        isModalOpen.value = false;
        setTimeout(() => {
            selectedTerm.value = null;
        }, 300);
    });

    return (
        <div class="min-h-screen relative overflow-hidden font-sans pb-20">
            {/* Mesh Gradients System */}
            <div class="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/10 dark:bg-red-600/20 blur-[120px]" />
                <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 dark:bg-blue-600/20 blur-[120px]" />
                <div class="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-emerald-600/5 dark:bg-emerald-600/10 blur-[100px]" />
            </div>

            <div class="max-w-6xl mx-auto px-6 py-12">
                {/* Header Section */}
                <header class="mb-12">
                    <div class="flex flex-col md:flex-row items-center gap-6">
                        {/* Compact Search Bar */}
                        <div class="relative group flex-1 w-full">
                            <input
                                type="text"
                                bind:value={searchQuery}
                                placeholder="Cerca tra tutti i termini del dizionario..."
                                class="w-full pl-6 pr-14 py-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-xl text-lg text-gray-900 dark:text-white placeholder-gray-400"
                            />
                            <div class="absolute inset-y-0 right-0 pr-6 flex items-center">
                                <span class="text-2xl opacity-50">🔍</span>
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div class="flex p-1 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                            <button
                                onClick$={() => viewMode.value = 'list'}
                                class={`p-2.5 rounded-xl transition-all duration-300 ${viewMode.value === 'list' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-red-500'}`}
                                aria-label="Vista lista"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <button
                                onClick$={() => viewMode.value = 'grid'}
                                class={`p-2.5 rounded-xl transition-all duration-300 ${viewMode.value === 'grid' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-red-500'}`}
                                aria-label="Vista griglia"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div class="lg:col-span-12">
                        {/* Term Count Label */}
                        <div class="mb-6 flex items-center gap-4">
                            <span class="px-4 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-xs font-black uppercase tracking-wider">
                                {filteredTerms.value.length} termini trovati
                            </span>
                        </div>

                        {/* List vs Grid Rendering */}
                        <div class={viewMode.value === 'list' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                            {filteredTerms.value.map((term) => (
                                <div
                                    key={term.id}
                                    onClick$={() => openModal(term)}
                                    class={`group cursor-pointer relative overflow-hidden transition-all duration-300 bg-white dark:bg-slate-900/40 border-gray-100 dark:border-white/5 border hover:border-red-500/30 hover:scale-[1.02] shadow-sm hover:shadow-2xl hover:shadow-red-500/10 ${viewMode.value === 'list' ? 'flex items-center gap-6 p-6 rounded-[2rem]' : 'flex flex-col p-8 rounded-[2.5rem]'
                                        }`}
                                >
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3 mb-2">
                                            <span class="text-[10px] font-black px-2 py-0.5 bg-white/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md uppercase tracking-wider">
                                                {term.category}
                                            </span>
                                            {term.audio_url && (
                                                <span class="text-sm">🔊</span>
                                            )}
                                        </div>
                                        <h3 class="text-2xl font-black text-gray-900 dark:text-white leading-tight pr-10">{term.term}</h3>
                                        <div
                                            class="text-gray-500 dark:text-slate-400 line-clamp-2 mt-1 pr-10 prose prose-sm dark:prose-invert"
                                            dangerouslySetInnerHTML={term.description}
                                        />
                                    </div>

                                    {/* Sparkle Icon */}
                                    <div class="absolute top-6 right-6 w-10 h-10 rounded-full bg-red-500/10 dark:bg-white/5 flex items-center justify-center transition-all duration-500 group-hover:bg-red-500 group-hover:text-white">
                                        <span class="text-lg">✨</span>
                                    </div>

                                    {viewMode.value === 'list' && (
                                        <div class="font-japanese text-3xl opacity-5 dark:opacity-10 absolute right-16 scale-150 rotate-12 pointer-events-none">
                                            {term.kanji}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL SYSTEM */}
            <div
                class={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 transition-all duration-500 ${isModalOpen.value ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
            >
                {/* Backdrop */}
                <div
                    onClick$={closeModal}
                    class="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
                />

                {/* Modal Body */}
                <div class={`relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 transition-all duration-500 transform ${isModalOpen.value ? 'scale-100 translate-y-0' : 'scale-90 translate-y-12'}`}>
                    {selectedTerm.value && (
                        <div class="flex flex-col">
                            {/* Modal Header/Image Area */}
                            <div class="h-48 bg-gradient-to-br from-red-600 via-red-500 to-orange-400 flex items-center justify-center relative">
                                <div class="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                                <div class="text-white text-7xl md:text-8xl font-black font-japanese drop-shadow-2xl animate-pulse">
                                    {selectedTerm.value.kanji}
                                </div>
                                <button
                                    onClick$={closeModal}
                                    class="absolute top-6 right-6 w-12 h-12 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center text-2xl transition-all"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div class="p-8 md:p-12 relative">
                                <div class="flex items-center gap-4 mb-6">
                                    <span class="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-black uppercase">
                                        {selectedTerm.value.category}
                                    </span>
                                    {selectedTerm.value.audio_url && (
                                        <button class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-95">
                                            🔊
                                        </button>
                                    )}
                                </div>

                                <h2 class="text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                                    {selectedTerm.value.term}
                                </h2>
                                <div class="text-2xl font-bold font-japanese text-gray-400 mb-8 border-b border-gray-100 dark:border-white/5 pb-6">
                                    {selectedTerm.value.kanji}
                                </div>

                                <div
                                    class="text-xl text-gray-600 dark:text-slate-300 leading-relaxed font-medium prose prose-neutral dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={selectedTerm.value.long_description || selectedTerm.value.description}
                                />

                                <div class="mt-12 flex gap-4">
                                    <button
                                        onClick$={() => {
                                            const term = selectedTerm.value?.term || '';
                                            const rawDesc = selectedTerm.value?.description || '';
                                            // Strip HTML tags for a clean search query
                                            const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, ' ').substring(0, 60);
                                            const query = encodeURIComponent(`Judo ${term} ${cleanDesc}`);
                                            window.open(`https://www.google.com/search?q=${query}`, '_blank');
                                        }}
                                        class="flex-1 py-6 bg-gradient-to-r from-red-600 to-red-500 text-white font-black rounded-2xl hover:scale-[1.02] transition-transform shadow-xl shadow-red-500/20 flex flex-col items-center justify-center leading-none group"
                                    >
                                        <span class="text-[10px] uppercase tracking-[0.2em] mb-2 opacity-70 group-hover:opacity-100 transition-opacity">Ricerca Esterna</span>
                                        <div class="flex items-center gap-3">
                                            <span class="text-xl">APPROFONDISCI SU</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12.48 10.92v3.28h4.74c-.2 1.06-.9 1.95-1.82 2.56v2.14h2.94c1.72-1.58 2.71-3.9 2.71-6.62 0-.62-.06-1.22-.16-1.8H12.48z" />
                                                <path d="M12.48 21c2.43 0 4.47-.8 5.96-2.18l-2.94-2.14c-.8.54-1.82.86-3.02.86-2.32 0-4.28-1.57-4.98-3.67H4.42v2.24A8.514 8.514 0 0012.48 21z" />
                                                <path d="M7.5 13.87c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V8.23H4.42a8.532 8.532 0 000 7.88l3.08-2.24z" />
                                                <path d="M12.48 6.42c1.32 0 2.5.45 3.44 1.35l2.58-2.58C16.94 3.65 14.88 3 12.48 3a8.514 8.514 0 00-8.06 5.23l3.08 2.24c.7-2.1 2.66-3.67 4.98-3.67z" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Dizionario Prova - Design System Completo',
    meta: [
        {
            name: 'description',
            content: 'Versione avanzata del dizionario creativo con tutti i termini reali da PocketBase.',
        },
    ],
};
