import { component$, Slot, useStore, useContextProvider, useVisibleTask$, $, useSignal } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import type { RequestHandler } from '@builder.io/qwik-city';
import { AppContext, type AppState } from '~/context/app-context';
import SearchModal from '~/components/search-modal/search-modal';

export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl({
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    maxAge: 5,
  });
};

export default component$(() => {
  const appState = useStore<AppState>({
    isDark: false,
    isMenuOpen: false,
    isSearchOpen: false,
    expandedMenus: {},
  });

  useContextProvider(AppContext, appState);

  const initialized = useSignal(false);
  const loc = useLocation();

  // Reset section title when route changes
  useVisibleTask$(({ track }) => {
    track(() => loc.url.pathname);
    appState.sectionTitle = undefined;
    appState.sectionIcon = undefined;
  });

  // Initialize dark mode from localStorage (client-side only)
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    if (initialized.value) return;
    initialized.value = true;

    const saved = localStorage.getItem('theme');
    if (saved) {
      appState.isDark = saved === 'dark';
    } else {
      appState.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Apply initial theme
    if (appState.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  // Sync theme changes with DOM and localStorage
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => appState.isDark);

    if (appState.isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  });

  const toggleMenu = $(() => {
    appState.isMenuOpen = !appState.isMenuOpen;
  });

  const closeMenu = $(() => {
    appState.isMenuOpen = false;
  });

  const toggleTheme = $(() => {
    appState.isDark = !appState.isDark;
  });

  const openSearch = $(() => {
    appState.isSearchOpen = true;
  });

  const closeSearch = $(() => {
    appState.isSearchOpen = false;
  });

  const toggleSubmenu = $((title: string) => {
    appState.expandedMenus[title] = !appState.expandedMenus[title];
  });

  const navLinks = [
    { title: 'Home', href: '/' },
    { title: 'Tecniche', href: '/tecniche' },
    { title: 'Kata', href: '/kata' },
    { title: 'Dizionario', href: '/dizionario' },
    {
      title: 'Giochi',
      isSubmenu: true,
      items: [
        { title: 'Quiz Esame', href: '/quiz' },
        { title: 'Gokyo Quiz', href: '/gokyo-game' },
        { title: 'Gokyo-Tris', href: '/gokyo-tris' },
        { title: 'Flash Card', href: '/flash' },
        { title: 'Kaeshi & Renraku', href: '/kaeshi-renraku' },
      ]
    },
    { title: 'Storia', href: '/storia' },
    { title: 'FIJLKAM', href: '/fijlkam' },
    { title: 'Bacheca', href: '/bacheca' },
    { title: 'Archivio', href: '/community' },
  ];

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-deep-black font-sans text-gray-900 dark:text-ice-white flex flex-col transition-colors duration-500 relative overflow-hidden">
      {/* FIJLKAM Background Mesh Gradients - Enhanced */}
      <div class="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div class={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full transition-all duration-1000 blur-[120px] ${appState.isDark ? 'bg-red-600/15' : 'bg-red-200/30'}`} />
        <div class={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full transition-all duration-1000 blur-[120px] ${appState.isDark ? 'bg-blue-600/10' : 'bg-blue-100/20'}`} />
        <div class={`absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full transition-all duration-1000 blur-[100px] ${appState.isDark ? 'bg-emerald-600/5' : 'bg-emerald-50/20'}`} />
      </div>

      {/* Header */}
      <header class="sticky top-0 z-50 bg-white/80 dark:bg-deep-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shadow-sm">
        <div class="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Left: Logo/Title */}
          <div class="flex items-center">
            <Link href="/" class="text-xl font-bold text-gray-900 dark:text-ice-white flex items-center gap-3 no-underline hover:opacity-80 transition-opacity">
              <img src="/media/icons/apple-touch-icon.png" alt="Judo Logo" class="h-10 w-auto rounded-lg shadow-lg" width={40} height={40} />
              <span class="tracking-tighter font-black">JudoOK</span>
            </Link>

            {loc.url.pathname.startsWith('/gestione') ? (
              <div class="flex items-center gap-2 border-l border-gray-200 dark:border-white/10 ml-4 pl-4">
                <span class="text-xl">🛠️</span>
                <span class="text-base font-black text-red-600 dark:text-red-500 uppercase tracking-widest text-[13px]">
                  Gestione
                </span>
              </div>
            ) : appState.sectionTitle && (
              <div class="flex items-center gap-2 border-l border-gray-200 dark:border-white/10 ml-4 pl-4 animate-in fade-in slide-in-from-left duration-500">
                <span class="text-xl filter drop-shadow-sm">{appState.sectionIcon}</span>
                <span class="text-base font-black text-gray-600 dark:text-ice-gray hidden sm:inline uppercase tracking-widest text-[10px]">
                  {appState.sectionTitle}
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div class="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick$={toggleTheme}
              class="relative p-2.5 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-yellow-400 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm border border-transparent dark:border-white/10 group overflow-hidden"
              aria-label="Cambia tema"
            >
              <div class="relative w-5 h-5 flex items-center justify-center">
                {/* Sun Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class={`absolute inset-0 w-5 h-5 transition-all duration-500 transform ${appState.isDark ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                {/* Moon Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class={`absolute inset-0 w-5 h-5 transition-all duration-500 transform ${!appState.isDark ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
            </button>

            {/* Search Icon (Desktop) */}
            <button
              onClick$={openSearch}
              class="hidden md:flex p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Cerca"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Hamburger Menu Button */}
            <button
              onClick$={toggleMenu}
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none"
              aria-label="Menu"
            >
              <div class="w-6 h-5 flex flex-col justify-between">
                <span class={`block h-0.5 w-full bg-current transform transition-transform duration-300 ${appState.isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span class={`block h-0.5 w-full bg-current transition-opacity duration-300 ${appState.isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span class={`block h-0.5 w-full bg-current transform transition-transform duration-300 ${appState.isMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu Drawer */}
      <div class={`fixed inset-0 z-40 transition-opacity duration-300 ${appState.isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Overlay */}
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick$={closeMenu}
        ></div>

        {/* Drawer Content */}
        <div class={`absolute top-0 right-0 w-72 h-full bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-out ${appState.isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div class="flex flex-col h-full">
            <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
              <span class="font-bold text-lg text-gray-800 dark:text-white">Menu</span>
              <button onClick$={closeMenu} class="text-gray-500 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            <nav class="flex-1 overflow-y-auto py-4">
              <ul class="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.title}>
                    {link.isSubmenu ? (
                      <div>
                        <button
                          onClick$={() => toggleSubmenu(link.title)}
                          class="w-full flex justify-between items-center px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium border-l-4 border-transparent"
                        >
                          <span>{link.title}</span>
                          <span class={`text-xs transition-transform duration-200 ${appState.expandedMenus[link.title] ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        <div class={`bg-gray-50 dark:bg-gray-850 overflow-hidden transition-all duration-300 ${appState.expandedMenus[link.title] ? 'max-h-64' : 'max-h-0'}`}>
                          {link.items?.map(subItem => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick$={closeMenu}
                              class="block px-10 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              • {subItem.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        onClick$={closeMenu}
                        class="block px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium border-l-4 border-transparent hover:border-red-500"
                      >
                        {link.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div class="p-4 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-400">
              JudoOK App v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main class={loc.url.pathname.startsWith('/gestione') ? "flex-grow flex flex-col" : "container mx-auto px-4 py-6 pb-24 flex-grow"}>
        <Slot />
      </main>

      {/* Bottom Navigation (Mobile) */}
      {!loc.url.pathname.startsWith('/gestione') && (
        <nav class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 pb-safe z-30 md:hidden">
          <div class="flex justify-around items-center h-16">
            <Link href="/" class="flex flex-col items-center justify-center w-full h-full text-red-600 dark:text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span class="text-xs font-medium mt-1">Home</span>
            </Link>

            <button
              onClick$={openSearch}
              class="flex flex-col items-center justify-center w-full h-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <div class="bg-red-600 text-white rounded-full p-3 -mt-6 shadow-lg border-4 border-white dark:border-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span class="text-xs font-medium mt-1">Cerca</span>
            </button>

            <Link href="/tecniche" class="flex flex-col items-center justify-center w-full h-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span class="text-xs font-medium mt-1">Tecniche</span>
            </Link>
          </div>
        </nav>
      )}

      {/* Search Modal */}
      <SearchModal isOpen={appState.isSearchOpen} onClose={closeSearch} />
    </div>
  );
});
