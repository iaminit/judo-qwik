import { component$, Slot, useSignal, useVisibleTask$, $, useContext, useStyles$ } from '@builder.io/qwik';
import { useNavigate, useLocation } from '@builder.io/qwik-city';
import { pbAdmin, logoutAdmin } from '~/lib/pocketbase-admin';
import { AppContext } from '~/context/app-context';

export default component$(() => {
    useAdminStyles();
    const nav = useNavigate();
    const loc = useLocation();
    const isExpanded = useSignal(false); // Compact by default on mobile
    const isCheckingAuth = useSignal(true);
    const appState = useContext(AppContext);

    // Auto-expand on large screens
    useVisibleTask$(() => {
        if (window.innerWidth >= 1024) {
            isExpanded.value = true;
        }
    });

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

    const toggleSidebar = $(() => {
        isExpanded.value = !isExpanded.value;
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
                class={`flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/5 transition-all duration-300 z-50 flex flex-col ${isExpanded.value ? 'w-72' : 'w-20'
                    }`}
            >
                <div class="h-full flex flex-col">
                    {/* Toggle Button */}
                    <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-center lg:justify-end">
                        <button
                            onClick$={toggleSidebar}
                            class="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-600 transition-colors"
                            title={isExpanded.value ? 'Contraì' : 'Espandi'}
                        >
                            <span class={`block transition-transform duration-300 ${isExpanded.value ? 'rotate-180' : ''}`}>
                                ➔
                            </span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                        {menuItems.map((item) => {
                            const isActive = loc.url.pathname === item.href || (item.href !== '/gestione' && loc.url.pathname.startsWith(item.href));
                            return (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    class={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all group overflow-hidden whitespace-nowrap ${isActive
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    title={!isExpanded.value ? item.label : undefined}
                                >
                                    <span class="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                                    <span class={`text-sm transition-all duration-300 ${isExpanded.value ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                                        {item.label}
                                    </span>
                                </a>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer */}
                    <div class="p-4 border-t border-gray-100 dark:border-gray-800">
                        {isExpanded.value && (
                            <div class="mb-4 px-4 animate-in fade-in slide-in-from-left duration-300">
                                <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Sessione</p>
                                <p class="text-[10px] font-bold text-gray-500 truncate">{pbAdmin.authStore.model?.email}</p>
                            </div>
                        )}
                        <button
                            onClick$={handleLogout}
                            class="w-full flex items-center gap-4 px-4 py-3 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                            title={!isExpanded.value ? 'Esci' : undefined}
                        >
                            <span class="text-xl flex-shrink-0">🚪</span>
                            {isExpanded.value && <span class="text-sm">Esci</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div class="flex-1 flex flex-col h-full overflow-hidden relative">
                <main class="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                    <Slot />
                </main>
            </div>
        </div>
    );
});

export const useAdminStyles = () => {
    useStyles$(`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.2);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.4);
        }
    `);
};
