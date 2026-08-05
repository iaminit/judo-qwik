import { component$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';

export const BottomNav = component$(() => {
  const loc = useLocation();
  const pathname = loc.url.pathname;

  const items = [
    {
      label: 'Home',
      href: '/',
      isActive: pathname === '/',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Studia',
      href: '/tecniche',
      isActive: pathname.startsWith('/tecniche') || pathname.startsWith('/kata') || pathname.startsWith('/dizionario') || pathname.startsWith('/storia'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: 'Quiz',
      href: '/quiz',
      isActive: pathname.startsWith('/quiz') || pathname.startsWith('/gokyo-game') || pathname.startsWith('/gokyo-tris') || pathname.startsWith('/flash'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      label: 'Risorse',
      href: '/bacheca',
      isActive: pathname.startsWith('/bacheca') || pathname.startsWith('/fijlkam') || pathname.startsWith('/gallery'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      class="fixed bottom-0 left-0 right-0 z-40 lg:hidden pb-safe border-t shadow-lg backdrop-blur-md"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div class="flex justify-around items-center h-16 max-w-md mx-auto">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            class="flex flex-col items-center justify-center flex-1 h-full no-underline transition-colors pressable"
            style={{
              color: item.isActive ? 'var(--color-action)' : 'var(--color-text-muted)',
            }}
          >
            <div class={`transition-transform duration-200 ${item.isActive ? 'scale-110' : ''}`}>
              {item.icon}
            </div>
            <span class="text-xs font-semibold mt-1 tracking-tight">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
});
