import { component$, Slot, useSignal, useVisibleTask$, $, useContext } from '@builder.io/qwik';
import { useNavigate, useLocation } from '@builder.io/qwik-city';
import { pbAdmin, logoutAdmin } from '~/lib/pocketbase-admin';
import { AppContext } from '~/context/app-context';

export default component$(() => {
    const nav = useNavigate();
    const loc = useLocation();
    const isSidebarOpen = useSignal(true);
    const isCheckingAuth = useSignal(true);
    const appState = useContext(AppContext);

    // Auth Protection
    useVisibleTask$(({ track }) => {
        track(() => loc.url.pathname);

        // Skip auth check for login page
        if (loc.url.pathname.startsWith('/gestione/login')) {
            isCheckingAuth.value = false;
            return;
        }

        const authStore = pbAdmin.authStore as any;
        if (!authStore.isValid || (!authStore.isSuperuser && authStore.record?.collectionName !== '_superusers')) {
            nav('/gestione/login');
        } else {
            isCheckingAuth.value = false;
        }
    });

    const handleLogout = $(() => {
        logoutAdmin();
        nav('/gestione/login');
    });

    const menuItems = [
        { label: 'Dashboard', icon: '📊', href: '/gestione' },
        { label: 'Tecniche', icon: '🥋', href: '/gestione/tecniche' },
        { label: 'Dizionario', icon: '📚', href: '/gestione/dizionario' },
        { label: 'Galleria', icon: '🖼️', href: '/gestione/gallery' },
        { label: 'Bacheca & Archivio', icon: '📰', href: '/gestione/bacheca' },
        { label: 'Kata', icon: '📜', href: '/gestione/kata' },
        { label: 'Storia', icon: '📖', href: '/gestione/storia' },
        { label: 'Community', icon: '👥', href: '/gestione/community' },
        { label: 'Programmi', icon: '📝', href: '/gestione/programma' },
        { label: 'FIJLKAM', icon: '🏛️', href: '/gestione/fijlkam' },
        { label: 'Impostazioni', icon: '⚙️', href: '/gestione/settings' },
    ];

    if (loc.url.pathname.startsWith('/gestione/login')) {
        return <Slot />;
    }

    if (isCheckingAuth.value) {
        return (
            <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div class="animate-pulse flex flex-col items-center">
                    <div class="w-12 h-12 bg-red-600 rounded-xl mb-4"></div>
                    <div class="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div class="flex-1 bg-gray-100 dark:bg-black flex font-sans overflow-hidden">
            {/* Sidebar */}
            <aside
                class={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen.value ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div class="h-full flex flex-col pt-4">
                    {/* Navigation */}
                    <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                class={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all group ${loc.url.pathname === item.href || (item.href !== '/gestione' && loc.url.pathname.startsWith(item.href))
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <span class="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                <span class="text-sm">{item.label}</span>
                            </a>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div class="p-4 border-t border-gray-100 dark:border-gray-800">
                        <div class="mb-4 px-4 hidden lg:block">
                            <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Sessione</p>
                            <p class="text-[10px] font-bold text-gray-500 truncate">{pbAdmin.authStore.model?.email}</p>
                        </div>
                        <button
                            onClick$={handleLogout}
                            class="w-full flex items-center gap-4 px-4 py-3 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                        >
                            <span class="text-xl">🚪</span>
                            <span class="text-sm">Esci</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div class="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
                <div class="flex-1 overflow-y-auto p-4 md:p-10">
                    <Slot />
                </div>
            </div>
        </div>
    );
});
