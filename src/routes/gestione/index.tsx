import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate, Link, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
  const nav = useNavigate();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const authStore = pbAdmin.authStore as any;
    if (!authStore.isValid) {
      nav('/gestione/login');
    }
  });

  const menuItems = [
    {
      title: 'Bacheca Notizie',
      desc: 'Visualizza e gestisci comunicati e notizie del dojo',
      icon: '📰',
      href: '/gestione/bacheca',
      badge: 'Bacheca',
    },
    {
      title: 'Database Tecniche',
      desc: 'Gestisci le tecniche del Gokyo no Waza',
      icon: '🥋',
      href: '/gestione/tecniche',
      badge: 'Tecniche',
    },
    {
      title: 'Catalogo Kata',
      desc: 'Gestisci le forme tradizionali del Judo',
      icon: '📖',
      href: '/gestione/kata',
      badge: 'Kata',
    },
    {
      title: 'Dizionario Termini',
      desc: 'Gestisci i vocaboli e la terminologia nipponica',
      icon: '📚',
      href: '/gestione/dizionario',
      badge: 'Dizionario',
    },
    {
      title: 'Categorie',
      desc: 'Gestisci gruppi, sottocategorie, icone, colori e ordine',
      icon: '🏷️',
      href: '/gestione/categorie',
      badge: 'Categorie',
    },
    {
      title: 'Domande Quiz',
      desc: 'Gestisci domande, risposte, spiegazioni, immagini e livelli DAN',
      icon: '❓',
      href: '/gestione/domande-quiz',
      badge: 'Quiz',
    },
    {
      title: 'Programma Esami',
      desc: 'Gestisci requisiti e programmi di gradazione',
      icon: '🎓',
      href: '/gestione/programma',
      badge: 'Esami',
    },
    {
      title: 'Storia del Judo',
      desc: 'Gestisci articoli storici ed eventi della cronologia',
      icon: '📜',
      href: '/gestione/storia',
      badge: 'Storia',
    },
    {
      title: 'Sezione FIJLKAM',
      desc: 'Gestisci informazioni, cronologia, regolamenti e programmi DAN',
      icon: '🇮🇹',
      href: '/gestione/fijlkam',
      badge: 'FIJLKAM',
    },
    {
      title: 'Community',
      desc: 'Gestione e moderazione messaggi community',
      icon: '💬',
      href: '/gestione/community',
      badge: 'Community',
    },
    {
      title: 'Galleria',
      desc: 'Gestisci le schede fotografiche e video del database',
      icon: '📸',
      href: '/gestione/gallery',
      badge: 'Galleria',
    },
    {
      title: 'Media & File',
      desc: 'Libreria immagini e risorse multimediali',
      icon: '🖼️',
      href: '/gestione/media',
      badge: 'Media',
    },
    {
      title: 'Impostazioni Sistema',
      desc: 'Configurazione sistema e parametri generali',
      icon: '⚙️',
      href: '/gestione/settings',
      badge: 'Sistema',
    },
  ];

  return (
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* Header Gestione */}
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            Pannello di Gestione
          </h1>
          <p class="text-base mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Seleziona una sezione per accedere all'elenco dei contenuti e apportare modifiche.
          </p>
        </div>
      </div>

      {/* Grid Dashboard */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            class="group relative flex items-center p-5 rounded-2xl border no-underline transition-all duration-200 pressable shadow-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shrink-0 text-2xl"
              style={{ backgroundColor: 'var(--color-surface-alt)' }}
            >
              {item.icon}
            </div>

            <div class="flex-1 min-w-0 pr-2">
              <div class="flex items-center gap-2">
                <h3
                  class="font-bold text-lg leading-tight truncate m-0 group-hover:text-[var(--color-action)] transition-colors"
                  style={{ color: 'var(--color-text)' }}
                >
                  {item.title}
                </h3>
                {item.badge && (
                  <span
                    class="px-2 py-0.5 text-xs font-semibold rounded-md shrink-0"
                    style={{
                      backgroundColor: 'rgba(180, 35, 45, 0.1)',
                      color: 'var(--color-action)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <p class="text-sm leading-normal truncate m-0 mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {item.desc}
              </p>
            </div>

            <div class="shrink-0 text-xl font-bold opacity-40 group-hover:opacity-100 transition-opacity">
              ›
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Pannello Gestione - JudoOK',
};
