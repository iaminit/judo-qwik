import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';

export interface ThemeToggleProps {
  themeSignal?: { value: 'light' | 'night' };
  onToggle$? : () => void;
}

export const ThemeToggle = component$<ThemeToggleProps>(({ themeSignal }) => {
  const currentTheme = useSignal<'light' | 'night'>('light');

  // Sync initial theme from document.documentElement or cookie
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const active = (document.documentElement.dataset.theme as 'light' | 'night') ||
                   (document.documentElement.classList.contains('dark') ? 'night' : 'light');
    currentTheme.value = active;
    if (themeSignal) {
      themeSignal.value = active;
    }
  });

  const toggleTheme = $(() => {
    const next = currentTheme.value === 'light' ? 'night' : 'light';
    currentTheme.value = next;
    if (themeSignal) {
      themeSignal.value = next;
    }

    document.documentElement.dataset.theme = next;
    if (next === 'night') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', next === 'night' ? 'dark' : 'light');
    document.cookie = `judook-theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  });

  const isNight = currentTheme.value === 'night';

  return (
    <button
      onClick$={toggleTheme}
      class="relative w-12 h-12 rounded-2xl flex items-center justify-center pressable border transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-surface-alt)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
      aria-label={`Passa al tema ${isNight ? 'bianco' : 'notte'}`}
      title={`Passa al tema ${isNight ? 'bianco' : 'notte'}`}
    >
      <div class="relative w-6 h-6 flex items-center justify-center">
        {/* Sun Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class={`absolute inset-0 w-6 h-6 transition-all duration-300 transform ${
            isNight ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: '#F59E0B' }}
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
          />
        </svg>
        {/* Moon Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class={`absolute inset-0 w-6 h-6 transition-all duration-300 transform ${
            !isNight ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: '#475569' }}
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
    </button>
  );
});
