import { component$, useSignal, useStore, $, useComputed$, useContext, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$ } from '@builder.io/qwik-city';
import { AppContext } from '~/context/app-context';
import { pbAdmin } from '~/lib/pocketbase-admin';
import BlogCard, { type Post } from '~/components/blog-card/blog-card';
import BlogModal from '~/components/blog-modal/blog-modal';

export const useBachecaData = routeLoader$(async () => {
  try {
    // Authenticate if needed (server-side only)
    if (!pbAdmin.authStore.isValid) {
      await pbAdmin.admins.authWithPassword('ad@judo.ok', 'Password123!');
    }

    console.log('[Bacheca] Fetching with pbAdmin...');
    const posts = await pbAdmin.collection('bacheca').getFullList({
      sort: '-data_riferimento',
      requestKey: null,
    });

    console.log(`[Bacheca] Raw records found: ${posts.length}`);

    const mappedPosts = posts.map((p: any) => ({
      id: p.id,
      title: p.titolo || '',
      content: p.contenuto || '',
      excerpt: p.descrizione_breve || '',
      date: (p.data_riferimento && !isNaN(new Date(p.data_riferimento).getTime()))
        ? p.data_riferimento
        : p.created || new Date().toISOString(),
      expiration_date: p.data_fine || '',
      activity: p.categoria_secondaria || p.tags || '',
      image: p.immagine_principale || '',
      link: p.link_esterno || '',
      published: p.pubblicato !== false,
      featured: p.in_evidenza || false,
      collectionId: p.collectionId,
      cover_image: p.immagine_principale,
    }));

    return {
      posts: mappedPosts as unknown as Post[],
    };
  } catch (err: any) {
    console.error('[Bacheca] Loader Error:', err.message || err);
    return {
      posts: [],
      error: 'Impossibile caricare i post.',
    };
  }
});

export default component$(() => {
  const data = useBachecaData();

  const searchTerm = useSignal('');
  const activityFilter = useSignal('all');
  const yearFilter = useSignal('all');
  const appState = useContext(AppContext);

  useVisibleTask$(() => {
    appState.sectionTitle = 'Bacheca & Archivio';
    appState.sectionIcon = '📌';
  });

  const modalState = useStore({
    isOpen: false,
    selectedPost: null as Post | null,
  });

  const openModal = $((post: Post) => {
    modalState.selectedPost = post;
    modalState.isOpen = true;
  });

  const closeModal = $(() => {
    modalState.isOpen = false;
    setTimeout(() => {
      modalState.selectedPost = null;
    }, 300);
  });

  // Get unique activities for filter
  const activities = useComputed$(() => {
    const uniqueActivities = new Set(
      data.value.posts.map((p) => p.activity).filter((a): a is string => !!a)
    );
    return ['all', ...Array.from(uniqueActivities)];
  });

  // Get unique years for filter
  const years = useComputed$(() => {
    const uniqueYears = new Set(
      data.value.posts
        .map((p) => {
          const d = new Date(p.date);
          return isNaN(d.getTime()) ? null : d.getFullYear().toString();
        })
        .filter((y): y is string => !!y)
    );
    return ['all', ...Array.from(uniqueYears).sort((a, b) => b.localeCompare(a))];
  });

  // Filter posts based on search, activity and year
  const allFilteredPosts = useComputed$(() => {
    return data.value.posts.filter((post) => {
      const matchesSearch =
        searchTerm.value === '' ||
        post.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.value.toLowerCase());

      const matchesActivity =
        activityFilter.value === 'all' || post.activity === activityFilter.value;

      const postYear = new Date(post.date).getFullYear().toString();
      const matchesYear = yearFilter.value === 'all' || postYear === yearFilter.value;

      return matchesSearch && matchesActivity && matchesYear;
    });
  });

  const visibleArchiveCount = useSignal(6);
  const scrollSentinelRef = useSignal<Element>();

  // Reset pagination when filters change
  useVisibleTask$(({ track }) => {
    track(() => searchTerm.value);
    track(() => activityFilter.value);
    track(() => yearFilter.value);
    visibleArchiveCount.value = 6;
  });

  // Infinite Scroll Logic
  useVisibleTask$(({ track, cleanup }) => {
    track(() => scrollSentinelRef.value);
    if (!scrollSentinelRef.value) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleArchiveCount.value < sections.value.archivio.length) {
          visibleArchiveCount.value += 6;
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(scrollSentinelRef.value);
    cleanup(() => observer.disconnect());
  });

  // Split into Actual News and Archivio
  const sections = useComputed$(() => {
    const now = new Date();
    const actualNews: Post[] = [];
    const archivio: Post[] = [];

    allFilteredPosts.value.forEach((post) => {
      if (post.expiration_date && new Date(post.expiration_date) < now) {
        archivio.push(post);
      } else {
        actualNews.push(post);
      }
    });

    return { actualNews, archivio };
  });

  const visibleArchivio = useComputed$(() => {
    return sections.value.archivio.slice(0, visibleArchiveCount.value);
  });

  const handleSearchChange = $((value: string) => {
    searchTerm.value = value;
  });

  const clearSearch = $(() => {
    searchTerm.value = '';
  });

  return (
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-12">

      {/* Hero Header */}
      <div class="text-center space-y-4 mb-12">
        <h1 class="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
          Bacheca & <span class="text-red-600">Archivio</span>
        </h1>
        <p class="text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto">
          Resta aggiornato sulle ultime novità del Dojo e consulta l'archivio storico delle nostre attività.
        </p>
      </div>

      {/* Filter Section */}
      <div class="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl space-y-6">
        {/* Search */}
        <div class="relative max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Cerca negli avvisi..."
            value={searchTerm.value}
            onInput$={(e) => handleSearchChange((e.target as HTMLInputElement).value)}
            class="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-red-500 outline-none transition-all text-lg"
          />
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          {searchTerm.value && (
            <button
              onClick$={clearSearch}
              class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          )}
        </div>

        <div class="flex flex-wrap items-center justify-center gap-4">
          {/* Activity Dropdown */}
          <div class="flex items-center gap-2">
            <span class="text-xs font-black uppercase tracking-widest text-gray-400">Attività:</span>
            <select
              value={activityFilter.value}
              onChange$={(e) => (activityFilter.value = (e.target as HTMLSelectElement).value)}
              class="bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="all">Tutte</option>
              {activities.value.filter(a => a !== 'all').map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Year Dropdown */}
          <div class="flex items-center gap-2">
            <span class="text-xs font-black uppercase tracking-widest text-gray-400">Anno:</span>
            <select
              value={yearFilter.value}
              onChange$={(e) => (yearFilter.value = (e.target as HTMLSelectElement).value)}
              class="bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="all">Tutti</option>
              {years.value.filter(y => y !== 'all').map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div class="space-y-20">
        {/* Actual News - nasconde se filtri attivi e nessun risultato */}
        {sections.value.actualNews.length > 0 && (
          <section class="space-y-8">
            <div class="flex items-center gap-4">
              <span class="text-3xl">📌</span>
              <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                Notizie <span class="text-red-600">Attuali</span>
              </h2>
              <div class="h-1 flex-1 bg-gradient-to-r from-red-600/20 to-transparent rounded-full"></div>
              <span class="text-sm font-black text-gray-400 uppercase tracking-widest">
                {sections.value.actualNews.length} Post
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sections.value.actualNews.map((post) => (
                <BlogCard key={post.id} post={post} onClick={openModal} viewMode="grid" />
              ))}
            </div>
          </section>
        )}

        {/* Archivio - nasconde se filtri attivi e nessun risultato */}
        {sections.value.archivio.length > 0 && (
          <section class="space-y-8">
            <div class="flex items-center gap-4">
              <span class="text-3xl">📜</span>
              <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                Archivio <span class="text-gray-400">Storico</span>
              </h2>
              <div class="h-1 flex-1 bg-gradient-to-r from-gray-400/20 to-transparent rounded-full"></div>
              <span class="text-sm font-black text-gray-400 uppercase tracking-widest">
                Mostrati {visibleArchivio.value.length} di {sections.value.archivio.length}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 grayscale brightness-95 hover:grayscale-0 transition-all duration-700">
              {visibleArchivio.value.map((post) => (
                <BlogCard key={post.id} post={post} onClick={openModal} viewMode="grid" />
              ))}
            </div>

            {/* Sentinel for Infinite Scroll */}
            {visibleArchiveCount.value < sections.value.archivio.length && (
              <div
                ref={scrollSentinelRef}
                class="flex justify-center py-12"
              >
                <div class="animate-bounce text-gray-300">
                  <svg class="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <p class="text-[10px] font-black uppercase tracking-widest mt-2">Scorri per caricare altro</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Global Empty State - quando tutti i filtri sono attivi ma non ci sono risultati */}
        {(searchTerm.value || activityFilter.value !== 'all' || yearFilter.value !== 'all') &&
          sections.value.actualNews.length === 0 &&
          sections.value.archivio.length === 0 && (
            <div class="text-center py-32 bg-white dark:bg-gray-800 rounded-[3rem] shadow-xl border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in duration-500">
              <span class="text-8xl block mb-6 animate-bounce">🔍</span>
              <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                Nessun Risultato Trovato
              </h2>
              <p class="text-gray-500 dark:text-gray-400 mt-2 font-medium italic">
                {searchTerm.value && `Nessuna corrispondenza per "${searchTerm.value}". `}
                Prova a modificare i filtri o resettare la ricerca.
              </p>
              <button
                onClick$={() => {
                  searchTerm.value = '';
                  activityFilter.value = 'all';
                  yearFilter.value = 'all';
                }}
                class="mt-8 px-10 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                Reset Tutti i Filtri
              </button>
            </div>
          )}
      </div>

      {/* Modal */}
      <BlogModal
        post={modalState.selectedPost}
        isOpen={modalState.isOpen}
        onClose={closeModal}
      />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Bacheca & Archivio - JudoOK',
  meta: [
    {
      name: 'description',
      content: 'Consulta le ultime news e l\'archivio storico del Dojo JudoOK.',
    },
  ],
};
