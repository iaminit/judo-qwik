import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { AdminTaskList } from '~/components/admin/admin-task-list';
import { TaskModal } from '~/components/admin/task-modal';

interface DashboardStats {
  techniques: number;
  dictionary: number;
  gallery: number;
  posts: number;
  categories: { name: string, count: number }[];
}

export default component$(() => {
  const dashboardData = useSignal<DashboardStats>({
    techniques: 0,
    dictionary: 0,
    gallery: 0,
    posts: 0,
    categories: []
  });
  const isLoading = useSignal(true);
  const isModalOpen = useSignal(false);

  const fetchStats = $(async () => {
    isLoading.value = true;
    try {
      // Fetch collections individually to avoid one failing breaking all
      const [techsResult, dictResult, galleryResult, postsResult] = await Promise.allSettled([
        pbAdmin.collection('techniques').getFullList({ requestKey: null }),
        pbAdmin.collection('dictionary').getList(1, 1, { requestKey: null }),
        pbAdmin.collection('gallery').getList(1, 1, { requestKey: null }),
        pbAdmin.collection('post').getList(1, 1, { requestKey: null }),
      ]);

      const techs = techsResult.status === 'fulfilled' ? techsResult.value : [];
      const dict = dictResult.status === 'fulfilled' ? dictResult.value : { totalItems: 0 };
      const gallery = galleryResult.status === 'fulfilled' ? galleryResult.value : { totalItems: 0 };
      const posts = postsResult.status === 'fulfilled' ? postsResult.value : { totalItems: 0 };

      const catMap: Record<string, number> = {};
      techs.forEach(t => {
        const cat = t.category || 'Altro';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });

      const categories = Object.entries(catMap).map(([name, count]) => ({ name, count }));

      dashboardData.value = {
        techniques: techs.length,
        dictionary: dict.totalItems,
        gallery: gallery.totalItems,
        posts: posts.totalItems,
        categories: categories.sort((a, b) => b.count - a.count)
      };
    } catch (e) {
      console.error('[Dashboard] Error fetching stats:', e);
    } finally {
      isLoading.value = false;
    }
  });

  useVisibleTask$(() => {
    fetchStats();
  });

  const handleOpenModal = $(() => {
    isModalOpen.value = true;
  });

  const handleCloseModal = $(() => {
    isModalOpen.value = false;
  });

  return (
    <div class="space-y-10 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <header>
        <h2 class="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          Benvenuto, <span class="text-red-600">Sensei</span>
        </h2>
        <p class="mt-2 text-gray-500 dark:text-gray-400 font-medium">
          Ecco cosa sta succedendo nel Dojo oggi.
        </p>
      </header>

      {/* Stats Grid */}
      {isLoading.value ? (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} class="h-32 bg-white dark:bg-gray-900 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Tecniche" value={dashboardData.value.techniques} icon="🥋" color="red" />
          <StatCard label="Termini" value={dashboardData.value.dictionary} icon="📚" color="blue" />
          <StatCard label="Media" value={dashboardData.value.gallery} icon="🖼️" color="green" />
          <StatCard label="News" value={dashboardData.value.posts} icon="📰" color="yellow" />
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Admin Tasks Panel */}
        <div class="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <span class="text-xl">✓</span>
              </div>
              <div>
                <h3 class="text-xl font-black text-gray-900 dark:text-white tracking-tight">Task Amministrativi</h3>
                <p class="text-xs text-gray-400 font-medium">Gestisci le attività del Dojo</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                onClick$={fetchStats}
                class="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Ricarica task"
              >
                🔄
              </button>
              <button
                onClick$={handleOpenModal}
                class="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
              >
                ➕ Nuovo Task
              </button>
            </div>
          </div>

          <AdminTaskList onRefresh={fetchStats} />
        </div>

        {/* Quick Actions */}
        <div class="bg-gray-900 rounded-3xl p-8 text-white shadow-xl shadow-gray-950/20">
          <h3 class="text-xl font-black mb-8 tracking-tight">Azioni Rapide</h3>
          <div class="grid grid-cols-1 gap-4">
            <ActionButton label="Aggiungi Tecnica" icon="🥋" href="/gestione/tecniche/new" primary />
            <ActionButton label="Nuovo Termine" icon="📚" href="/gestione/dizionario/new" />
            <ActionButton label="Aggiungi Galleria" icon="🖼️" href="/gestione/gallery/new" />
            <ActionButton label="Nuovo Post" icon="✍️" href="/gestione/bacheca/new" />
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isModalOpen.value}
        onClose={handleCloseModal}
        onTaskCreated={fetchStats}
      />
    </div>
  );
});

const StatCard = component$((props: { label: string, value: number, icon: string, color: string }) => {
  return (
    <div class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-5 shadow-sm hover:shadow-xl transition-all hover:scale-[1.02]">
      <div class={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-gray-200 dark:shadow-black/20 bg-gray-50 dark:bg-gray-800`}>
        {props.icon}
      </div>
      <div>
        <p class="text-2xl font-black text-gray-900 dark:text-white leading-tight">{props.value}</p>
        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{props.label}</p>
      </div>
    </div>
  );
});

const ActivityItem = component$((props: { title: string, time: string, user: string, icon: string }) => {
  return (
    <div class="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      <div class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
        {props.icon}
      </div>
      <div class="flex-1">
        <p class="text-sm font-bold text-gray-900 dark:text-white">{props.title}</p>
        <p class="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">{props.time} • da {props.user}</p>
      </div>
    </div>
  );
});

const ActionButton = component$((props: { label: string, icon: string, href: string, primary?: boolean }) => {
  return (
    <a
      href={props.href}
      class={`w-full py-4 px-6 rounded-2xl font-bold flex items-center gap-4 transition-all hover:scale-[1.05] ${props.primary
        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
        : 'bg-white/10 text-white hover:bg-white/20'
        }`}
    >
      <span class="text-xl">{props.icon}</span>
      <span class="text-sm tracking-wide">{props.label}</span>
    </a>
  );
});

export const head: DocumentHead = {
  title: 'Dashboard - JudoOK Gestione',
  meta: [
    {
      name: 'description',
      content: 'Dashboard amministrativa JudoOK',
    },
  ],
};
