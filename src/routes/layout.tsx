import { component$, Slot, useStore, useContextProvider, useVisibleTask$, $, useSignal } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import type { RequestHandler } from '@builder.io/qwik-city';
import { AppContext, type AppState } from '~/context/app-context';
import SearchModal from '~/components/search-modal/search-modal';
import { ThemeToggle } from '~/components/theme-toggle/theme-toggle';
import { BottomNav } from '~/components/bottom-nav/bottom-nav';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

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

  // Initialize theme from cookie/localStorage on mount
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    if (initialized.value) return;
    initialized.value = true;

    const saved = localStorage.getItem('theme');
    let isNight = false;

    if (saved) {
      isNight = saved === 'night' || saved === 'dark';
    } else {
      isNight = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    appState.isDark = isNight;
    document.documentElement.dataset.theme = isNight ? 'night' : 'light';
    if (isNight) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (Capacitor.isNativePlatform()) {
      StatusBar.hide().catch(() => { });
    }
  });

  // Sync theme state changes with DOM & localStorage
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => appState.isDark);

    const themeName = appState.isDark ? 'night' : 'light';
    document.documentElement.dataset.theme = themeName;
    if (appState.isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'night');
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
      title: 'Quiz Test Giochi',
      isSubmenu: true,
      items: [
        { title: 'Quiz Esame', href: '/quiz' },
        { title: 'Gokyo Quiz', href: '/gokyo-game' },
        { title: 'Gokyo-Tris', href: '/gokyo-tris' },
        { title: 'Flash Card', href: '/flash' },
        { title: '三段の道 (Sandan no Dō)', href: '/sandan-no-do' },
      ]
    },
    { title: 'Storia', href: '/storia' },
    { title: 'FIJLKAM', href: '/fijlkam' },
    { title: 'Bacheca & Archivio', href: '/bacheca' },
  ];

  return (
    <div
      class="min-h-screen font-sans flex flex-col relative transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      {/* App Header (Sticky 72px) */}
      {!appState.hideNav && (
        <header
          class="sticky top-0 z-50 h-[72px] border-b backdrop-blur-lg transition-colors duration-200"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-sticky)',
          }}
        >
          <div class="max-w-6xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
            {/* Left: Logo/Title */}
            <div class="flex items-center gap-3">
              <Link href="/" class="flex items-center gap-3 no-underline hover:opacity-90 transition-opacity">
                <img
                  src="/media/icons/apple-touch-icon.png"
                  alt="JudoOK Logo"
                  class="h-10 w-10 rounded-xl object-cover shadow-sm"
                  width={40}
                  height={40}
                />
                <span class="text-xl md:text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                  Judo<span style={{ color: 'var(--color-action)' }}>OK</span>
                </span>
              </Link>

              {loc.url.pathname.startsWith('/gestione') ? (
                <div class="flex items-center gap-1.5 border-l ml-3 pl-3 text-xs font-bold uppercase tracking-wider overflow-x-auto custom-scrollbar" style={{ borderColor: 'var(--color-border)' }}>
                  {(() => {
                    const parts = loc.url.pathname.replace(/\/$/, '').split('/').filter(Boolean);
                    const items: { label: string; href: string; isCurrent: boolean }[] = [];
                    items.push({ label: 'Gestione', href: '/gestione', isCurrent: parts.length <= 1 });
                    if (parts.length >= 2) {
                      const section = parts[1];
                      const names: Record<string, string> = {
                        bacheca: 'Bacheca',
                        tecniche: 'Tecniche',
                        kata: 'Kata',
                        dizionario: 'Dizionario',
                        programma: 'Programma Esami',
                        storia: 'Storia',
                        fijlkam: 'FIJLKAM',
                        gallery: 'Galleria',
                        community: 'Community',
                        media: 'Media',
                        login: 'Login',
                      };
                      const label = names[section] || (section.charAt(0).toUpperCase() + section.slice(1));
                      const href = `/gestione/${section}`;
                      items.push({ label, href, isCurrent: parts.length === 2 });

                      if (parts.length >= 3) {
                        const actionLabel = parts[2] === 'new' ? 'Nuovo' : 'Modifica';
                        items.push({ label: actionLabel, href: loc.url.pathname, isCurrent: true });
                      }
                    }

                    return items.map((crumb, idx) => (
                      <div key={crumb.href + idx} class="flex items-center gap-1.5 shrink-0">
                        {idx > 0 && <span class="opacity-40 text-[10px]">/</span>}
                        {crumb.isCurrent ? (
                          <span style={{ color: 'var(--color-action)' }}>{crumb.label}</span>
                        ) : (
                          <Link
                            href={crumb.href}
                            class="hover:underline opacity-70 hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {crumb.label}
                          </Link>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              ) : appState.sectionTitle && (
                <div class="hidden sm:flex items-center gap-2 border-l ml-3 pl-3" style={{ borderColor: 'var(--color-border)' }}>
                  <span class="text-lg">{appState.sectionIcon}</span>
                  <span class="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    {appState.sectionTitle}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div class="flex items-center gap-2 md:gap-3">
              {appState.isQuizPlaying && loc.url.pathname.includes('/quiz') ? (
                /* During Active Quiz: Full Aiuto Kano! button, dynamically styled by kanoHelpStep */
                <button
                  onClick$={$(() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('open-kano-help'));
                    }
                  })}
                  class={`h-11 px-3.5 rounded-full font-extrabold flex items-center gap-2 border-2 pressable shadow-md cursor-pointer shrink-0 transition-all duration-300 ${
                    appState.kanoHelpStep === 1
                      ? 'bg-red-600 hover:bg-red-500 text-white border-red-300 shadow-red-600/40 animate-pulse scale-105'
                      : appState.kanoHelpStep === 2
                      ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-300 shadow-purple-600/40 scale-105'
                      : 'bg-black hover:bg-black/90 text-white border-white'
                  }`}
                  title={
                    appState.kanoHelpStep === 1
                      ? '1° Tocco (ROSSO): Kano Tips! attivo'
                      : appState.kanoHelpStep === 2
                      ? '2° Tocco (VIOLA): Apri Ricerca'
                      : 'Clicca per attivare l\'Aiuto Kano'
                  }
                >
                  <img
                    src="/media/kano_i.webp"
                    alt="Jigoro Kano"
                    class="w-7 h-7 rounded-full object-cover shrink-0 border border-white/60"
                    width={28}
                    height={28}
                  />
                  <div class="text-[11px] uppercase font-black tracking-tight leading-none text-left">
                    <div>{appState.kanoHelpStep === 1 ? 'KANO' : appState.kanoHelpStep === 2 ? 'CERCA' : 'AIUTO'}</div>
                    <div>{appState.kanoHelpStep === 1 ? 'TIPS!' : appState.kanoHelpStep === 2 ? 'KANO' : 'KANO!'}</div>
                  </div>
                </button>
              ) : (
                /* Standard Header Controls */
                <>
                  <ThemeToggle />

                  {/* Search Button */}
                  <button
                    onClick$={openSearch}
                    class="w-12 h-12 rounded-2xl flex items-center justify-center pressable border transition-colors"
                    style={{
                      backgroundColor: 'var(--color-surface-alt)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                    aria-label="Cerca nel portale"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </>
              )}

              {/* Side Drawer Toggle */}
              <button
                onClick$={toggleMenu}
                class="w-12 h-12 rounded-2xl flex items-center justify-center pressable border transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                aria-label="Menu di navigazione"
              >
                <div class="w-5 h-4 flex flex-col justify-between">
                  <span class={`block h-0.5 w-full bg-current transition-transform duration-200 ${appState.isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span class={`block h-0.5 w-full bg-current transition-opacity duration-200 ${appState.isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span class={`block h-0.5 w-full bg-current transition-transform duration-200 ${appState.isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Side Menu Drawer */}
      <div class={`fixed inset-0 z-50 transition-opacity duration-300 ${appState.isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick$={closeMenu}></div>
        <div
          class={`absolute top-0 right-0 w-80 h-full shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
            appState.isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        >
          <div class="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
            <span class="font-bold text-xl">Menu</span>
            <button onClick$={closeMenu} class="text-2xl leading-none pressable" style={{ color: 'var(--color-text-muted)' }}>&times;</button>
          </div>

          <nav class="flex-1 overflow-y-auto p-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.title}>
                {link.isSubmenu ? (
                  <div>
                    <button
                      onClick$={() => toggleSubmenu(link.title)}
                      class="w-full flex justify-between items-center px-4 py-3.5 rounded-xl font-semibold transition-colors text-left"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <span>{link.title}</span>
                      <span class={`text-xs transition-transform duration-200 ${appState.expandedMenus[link.title] ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    <div class={`overflow-hidden transition-all duration-300 pl-4 ${appState.expandedMenus[link.title] ? 'max-h-64 mt-1' : 'max-h-0'}`}>
                      {link.items?.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick$={closeMenu}
                          class="block px-4 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors mb-1"
                          style={{ color: 'var(--color-text-muted)' }}
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
                    class="block px-4 py-3.5 rounded-xl font-semibold no-underline transition-colors hover:bg-[var(--color-surface-alt)]"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {link.title}
                  </Link>
                )}
              </div>
            ))}

            {/* Android App Download Banner */}
            <div class="mt-6 p-4 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-xl border border-white/20">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-2xl">📱</span>
                <div>
                  <div class="font-extrabold text-sm leading-tight">App Android JudoOK</div>
                  <div class="text-[11px] text-white/80 font-medium">Installa l'applicazione nativa APK</div>
                </div>
              </div>
              <a
                href="https://storage.googleapis.com/judo-qwik-downloads-238185604112/judo-app.apk"
                download="judo-app.apk"
                class="w-full py-2.5 px-3 mt-1 bg-white text-red-600 hover:bg-gray-100 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow transition-all no-underline"
              >
                <span>⬇️</span> Scarica APK Android
              </a>
            </div>
          </nav>

          <div class="p-4 border-t text-center text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            JudoOK App • Motion & Design System v2.0
          </div>
        </div>
      </div>

      {/* Main Page Body */}
      <main class={loc.url.pathname.startsWith('/gestione') ? "flex-grow flex flex-col" : "flex-grow pb-24 md:pb-12"}>
        <Slot />
      </main>

      {/* Bottom Navigation (Mobile <1024px) */}
      {!loc.url.pathname.startsWith('/gestione') && !appState.hideNav && <BottomNav />}

      {/* Global Search Modal */}
      <SearchModal isOpen={appState.isSearchOpen} onClose={closeSearch} />
    </div>
  );
});
