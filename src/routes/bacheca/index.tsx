import { component$, useSignal, useStore, $, useComputed$, useContext, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';
import BlogCard, { type Post } from '~/components/blog-card';
import BlogModal from '~/components/blog-modal';

export const useBachecaData = routeLoader$(async () => {
  try {
    console.log('[Bacheca] Fetching posts from PocketBase...');
    // Filter: expiration_date = "" || expiration_date > @now
    const posts = await pb.collection('post').getFullList({
      sort: '-date',
      filter: 'expiration_date = "" || expiration_date > @now',
      requestKey: null,
    });
    console.log('[Bacheca] Fetched', posts.length, 'active posts');

    return {
      posts: posts as unknown as Post[],
    };
  } catch (err) {
    console.error('[Bacheca] Error loading posts:', err);
    return {
      posts: [],
      error: 'Impossibile caricare i post. Riprova più tardi.',
    };
  }
});

export default component$(() => {
  const data = useBachecaData();

  const viewMode = useSignal<'grid' | 'list'>('grid');
  const searchTerm = useSignal('');
  const activityFilter = useSignal('all');
  const appState = useContext(AppContext);

  useVisibleTask$(() => {
    appState.sectionTitle = 'Bacheca';
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

  // Filter posts based on search and activity
  const filteredPosts = useComputed$(() => {
    return data.value.posts.filter((post) => {
      const matchesSearch =
        searchTerm.value === '' ||
        post.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.value.toLowerCase());

      const matchesActivity =
        activityFilter.value === 'all' || post.activity === activityFilter.value;

      return matchesSearch && matchesActivity;
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
          placeholder="Cerca nei post..."
          value={searchTerm.value}
          onInput$={(e) => handleSearchChange((e.target as HTMLInputElement).value)}
          class="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 outline-none transition-all text-lg shadow-sm"
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

      {/* Controls */}
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Activity Filter */}
        <div class="flex items-center gap-2 flex-wrap">
          {activities.value.map((activity) => (
            <button
              key={activity}
              onClick$={() => {
                activityFilter.value = activity;
              }}
              class={`px-4 py-2 rounded-full font-medium transition-all ${activityFilter.value === activity
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {activity === 'all' ? 'Tutti' : activity}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick$={() => {
              viewMode.value = 'grid';
            }}
            class={`p-2 rounded ${viewMode.value === 'grid'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'text-gray-500'
              }`}
            aria-label="Vista griglia"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick$={() => {
              viewMode.value = 'list';
            }}
            class={`p-2 rounded ${viewMode.value === 'list'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'text-gray-500'
              }`}
            aria-label="Vista lista"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Posts Count */}
      <div class="text-center text-gray-600 dark:text-gray-400">
        {filteredPosts.value.length === 0 ? (
          <p class="text-lg">Nessun post trovato</p>
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
  title: 'Bacheca - JudoOK',
  meta: [
    {
      name: 'description',
      content: 'Bacheca con novità, eventi e aggiornamenti dalla palestra di Judo.',
    },
  ],
};
