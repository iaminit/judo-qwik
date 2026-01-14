import { component$, useSignal, useStore, $, useComputed$, useContext, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';
import BlogCard, { type Post } from '~/components/blog-card';
import BlogModal from '~/components/blog-modal';

export const useCommunityData = routeLoader$(async () => {
  try {
    console.log('[Community] Fetching archived posts from PocketBase...');
    // Filter: expiration_date != "" && expiration_date <= @now
    const posts = await pb.collection('post').getFullList({
      sort: '-date',
      filter: 'expiration_date != "" && expiration_date <= @now',
      requestKey: null,
    });
    console.log('[Community] Fetched', posts.length, 'archived posts');

    return {
      posts: posts as unknown as Post[],
    };
  } catch (err) {
    console.error('[Community] Error loading archived posts:', err);
    return {
      posts: [],
      error: 'Impossibile caricare i post archiviati. Riprova più tardi.',
    };
  }
});

export default component$(() => {
  const data = useCommunityData();

  const viewMode = useSignal<'grid' | 'list'>('grid');
  const searchTerm = useSignal('');
  const activityFilter = useSignal('all');
  const yearFilter = useSignal('all');
  const appState = useContext(AppContext);

  useVisibleTask$(() => {
    appState.sectionTitle = 'Archivio';
    appState.sectionIcon = '🗃️';
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
      data.value.posts.map((p) => new Date(p.date).getFullYear().toString())
    );
    return ['all', ...Array.from(uniqueYears).sort().reverse()];
  });

  // Filter posts based on search, activity, and year
  const filteredPosts = useComputed$(() => {
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

  const handleSearchChange = $((value: string) => {
    searchTerm.value = value;
  });

  const clearSearch = $(() => {
    searchTerm.value = '';
  });

  return (
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Search Bar */}
      <div class="relative max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Cerca nell'archivio..."
          value={searchTerm.value}
          onInput$={(e) => handleSearchChange((e.target as HTMLInputElement).value)}
          class="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 outline-none transition-all text-lg shadow-sm"
        />
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
        {searchTerm.value && (
          <button
            onClick$={clearSearch}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>

      <div class="flex flex-col gap-6 bg-gray-50 dark:bg-gray-800/40 p-4 md:p-6 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <div class="flex flex-row items-center justify-between gap-6 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <div class="flex flex-row items-center gap-8 md:gap-12 flex-nowrap min-w-max">
            {/* Activity Filter Group */}
            <div class="flex items-center gap-3 flex-nowrap">
              <span class="text-[10px] font-black uppercase tracking-tighter text-gray-400 dark:text-gray-500 whitespace-nowrap">Attività</span>
              <div class="flex items-center gap-1.5 flex-nowrap">
                {activities.value.map((activity) => (
                  <button
                    key={activity}
                    onClick$={() => activityFilter.value = activity}
                    class={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-300 whitespace-nowrap ${activityFilter.value === activity
                      ? 'bg-purple-600 text-white shadow-md scale-105'
                      : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                  >
                    {activity === 'all' ? 'Tutte' : activity}
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div class="h-6 w-px bg-gray-200 dark:border-gray-700/50 shrink-0"></div>

            {/* Year Filter Group */}
            <div class="flex items-center gap-3 flex-nowrap">
              <span class="text-[10px] font-black uppercase tracking-tighter text-gray-400 dark:text-gray-500 whitespace-nowrap">Anno</span>
              <div class="flex items-center gap-1.5 flex-nowrap">
                {years.value.map((year) => (
                  <button
                    key={year}
                    onClick$={() => yearFilter.value = year}
                    class={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-300 whitespace-nowrap ${yearFilter.value === year
                      ? 'bg-purple-600 text-white shadow-md scale-105'
                      : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                  >
                    {year === 'all' ? 'Tutti' : year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div class="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-100 dark:border-gray-700 shrink-0 shadow-sm ml-auto">
            <button
              onClick$={() => viewMode.value = 'grid'}
              class={`p-1.5 rounded-lg transition-all ${viewMode.value === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="Vista griglia"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button
              onClick$={() => viewMode.value = 'list'}
              class={`p-1.5 rounded-lg transition-all ${viewMode.value === 'list' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="Vista lista"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Posts Count */}
      <div class="text-center text-gray-600 dark:text-gray-400">
        {filteredPosts.value.length === 0 ? (
          <p class="text-lg">Nessun post trovato nell'archivio</p>
        ) : (
          <p class="text-sm">
            {filteredPosts.value.length}{' '}
            {filteredPosts.value.length === 1 ? 'post trovato' : 'post trovati'}
          </p>
        )}
      </div>

      {/* Posts Grid/List */}
      <div
        class={
          viewMode.value === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'flex flex-col gap-6'
        }
      >
        {filteredPosts.value.map((post) => (
          <BlogCard key={post.id} post={post} onClick={openModal} viewMode={viewMode.value} />
        ))}
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
  title: 'Archivio Community - JudoOK',
  meta: [
    {
      name: 'description',
      content: 'Archivio storico di post, eventi e attività della palestra di Judo.',
    },
  ],
};
