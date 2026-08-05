import { component$, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { StudyRow } from '~/components/study-row/study-row';

export interface CardItem {
  title: string;
  desc: string;
  icon: string;
  iconType?: 'emoji' | 'img';
  href: string;
  badge?: string;
  defaultOrder: number;
}

const ALL_CARDS: CardItem[] = [
  {
    title: 'Tecniche',
    desc: 'Database completo del Gokyo no Waza',
    icon: '/media/home/tecniche.webp',
    href: '/tecniche',
    defaultOrder: 1,
  },
  {
    title: 'I Kata',
    desc: "Le forme tradizionali: l'estetica del movimento",
    icon: '/media/home/kata.webp',
    href: '/kata',
    defaultOrder: 2,
  },
  {
    title: 'Dizionario',
    desc: 'Glossario completo della terminologia nipponica',
    icon: '/media/home/dizionario.webp',
    href: '/dizionario',
    defaultOrder: 3,
  },
  {
    title: 'Storia del Judo',
    desc: "Origini, filosofia e l'eredità del Maestro Kano",
    icon: '/media/home/storia.webp',
    href: '/storia',
    defaultOrder: 4,
  },
  {
    title: 'Quiz Esame',
    desc: 'Simulazioni per i passaggi di grado',
    icon: '/media/home/quiz.webp',
    href: '/quiz',
    badge: 'Esame',
    defaultOrder: 5,
  },
  {
    title: 'Gokyo Quiz',
    desc: 'Sfida la tua conoscenza dei gruppi',
    icon: '🥋',
    iconType: 'emoji',
    href: '/gokyo-game',
    defaultOrder: 6,
  },
  {
    title: 'Gokyo-Tris',
    desc: 'Strategia e tecnica in un classico',
    icon: '⭕',
    iconType: 'emoji',
    href: '/gokyo-tris',
    defaultOrder: 7,
  },
  {
    title: 'Flash Cards',
    desc: 'Memorizzazione rapida dei termini',
    icon: '🎴',
    iconType: 'emoji',
    href: '/flash',
    defaultOrder: 8,
  },
  {
    title: 'Bacheca & Archivio',
    desc: 'News recenti e archivio storico del Dojo',
    icon: '/media/home/bacheca.webp',
    href: '/bacheca',
    defaultOrder: 9,
  },
  {
    title: 'FIJLKAM',
    desc: 'Federazione Italiana: programmi e regolamenti',
    icon: '/media/home/fijlkam.webp',
    href: '/fijlkam',
    defaultOrder: 10,
  },
];

const STORAGE_KEY = 'judo_card_usage';

export default component$(() => {
  const state = useStore({
    cards: ALL_CARDS,
  });

  const handleCardClick = $((href: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const usageMap: Record<string, number> = raw ? JSON.parse(raw) : {};
      usageMap[href] = (usageMap[href] || 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usageMap));
    } catch (e) {
      console.error('Error saving card usage', e);
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const usageMap: Record<string, number> = JSON.parse(raw);
        const sorted = [...ALL_CARDS].sort((a, b) => {
          const clicksA = usageMap[a.href] || 0;
          const clicksB = usageMap[b.href] || 0;
          if (clicksB !== clicksA) {
            return clicksB - clicksA;
          }
          return a.defaultOrder - b.defaultOrder;
        });
        state.cards = sorted;
      }
    } catch (e) {
      console.error('Error reading card usage', e);
    }
  });

  return (
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
        {state.cards.map((item) => (
          <StudyRow
            key={item.href}
            title={item.title}
            desc={item.desc}
            icon={item.icon}
            iconType={item.iconType}
            href={item.href}
            badge={item.badge}
            onClick$={$(() => handleCardClick(item.href))}
          />
        ))}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'JudoOK - Portale del Judo',
  meta: [
    {
      name: 'description',
      content:
        'Portale completo per lo studio del Judo: tecniche del Gokyo, kata, dizionario, quiz esame e risorse.',
    },
  ],
};