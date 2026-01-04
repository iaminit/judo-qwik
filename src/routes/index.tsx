import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { Link } from '@builder.io/qwik-city';

interface MenuItem {
  id: string;
  title: string;
  desc: string;
  icon: string | any;
  type?: 'emoji' | 'img';
  color: string;
  link?: string;
  isAccordion?: boolean;
  items?: MenuItem[];
}

// Tutti gli items in ordine alfabetico
const menuItems: MenuItem[] = [
  {
    id: 'bacheca',
    title: 'Bacheca & Archivio',
    desc: 'News recenti e archivio storico del Dojo',
    icon: '/media/home/bacheca.webp',
    color: 'red',
    link: '/bacheca',
  },
  {
    id: 'dizionario',
    title: 'Dizionario',
    desc: 'Glossario completo della terminologia nipponica',
    icon: '/media/home/dizionario.webp',
    color: 'amber',
    link: '/dizionario',
  },
  {
    id: 'fijlkam',
    title: 'FIJLKAM',
    desc: 'Federazione Italiana: programmi e regolamenti',
    icon: '/media/home/fijlkam.webp',
    color: 'blue',
    link: '/fijlkam',
  },
  {
    id: 'kata',
    title: 'I Kata',
    desc: 'Le forme tradizionali: l\'estetica del movimento',
    icon: '/media/home/kata.webp',
    color: 'orange',
    link: '/kata',
  },
  {
    id: 'giochi-group',
    title: 'Laboratorio Interattivo',
    desc: 'Quiz, Game, Flash Cards e strumenti di analisi',
    icon: '🎯',
    type: 'emoji',
    color: 'indigo',
    isAccordion: true,
    items: [
      {
        id: 'flash',
        title: 'Flash Cards',
        desc: 'Memorizzazione rapida dei termini',
        icon: '🎴',
        type: 'emoji',
        color: 'emerald',
        link: '/flash',
      },
      {
        id: 'gokyo-game',
        title: 'Gokyo Quiz',
        desc: 'Sfida la tua conoscenza dei gruppi',
        icon: '🥋',
        type: 'emoji',
        color: 'red',
        link: '/gokyo-game',
      },
      {
        id: 'gokyo-tris',
        title: 'Gokyo-Tris',
        desc: 'Strategia e tecnica in un classico',
        icon: '⭕',
        type: 'emoji',
        color: 'blue',
        link: '/gokyo-tris',
      },
      {
        id: 'quiz',
        title: 'Quiz Esame',
        desc: 'Simulazioni per i passaggi di grado',
        icon: '/media/home/quiz.webp',
        color: 'red',
        link: '/quiz',
      },
    ],
  },
  {
    id: 'storia',
    title: 'Storia del Judo',
    desc: 'Origini, filosofia e l\'eredità del Maestro Kano',
    icon: '/media/home/storia.webp',
    color: 'red',
    link: '/storia',
  },
  {
    id: 'tecniche',
    title: 'Tecniche',
    desc: 'Database completo del Gokyo no Waza',
    icon: '/media/home/tecniche.webp',
    color: 'red',
    link: '/tecniche',
  },
];

const colorMap: Record<string, string> = {
  red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/10',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/10',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/10',
  slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/10',
};

const ListItem = component$<{ item: MenuItem; isNested?: boolean }>(({ item, isNested }) => {
  return (
    <Link
      href={item.link || '#'}
      class={`group relative flex items-center p-5 rounded-[2rem] border border-gray-300/80 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] shadow-2xl shadow-gray-400/20 dark:shadow-none hover:shadow-red-500/15 active:scale-95 ${isNested ? 'mb-2' : 'mb-5'}`}
    >
      <div
        class={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shrink-0 border transition-all duration-700 group-hover:rotate-6 group-hover:scale-110 ${colorMap[item.color] || 'bg-gray-100 border-gray-200'}`}
      >
        {item.type === 'emoji' ? (
          <span class="text-3xl filter drop-shadow-md">{item.icon}</span>
        ) : (
          <img
            src={item.icon}
            alt={item.title}
            class="w-10 h-10 object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        )}
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="font-black text-gray-900 dark:text-white text-lg lg:text-xl leading-none uppercase tracking-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            {item.title}
          </h3>
          <span class="w-1.5 h-1.5 rounded-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></span>
        </div>
        <p class="text-sm text-gray-500 dark:text-slate-400 font-medium line-clamp-1">{item.desc}</p>
      </div>
      <div class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 dark:bg-white/5 border border-transparent group-hover:border-red-500/20 group-hover:translate-x-1 transition-all">
        <span class="text-xl font-black text-gray-300 dark:text-slate-600 group-hover:text-red-500 transition-colors">›</span>
      </div>
    </Link>
  );
});

const AccordionItem = component$<{ group: MenuItem }>(({ group }) => {
  const isOpen = useSignal(false);

  return (
    <div class="mb-5">
      <button
        onClick$={() => isOpen.value = !isOpen.value}
        class={`w-full group relative flex items-center p-5 rounded-[2rem] border transition-all duration-500 backdrop-blur-xl ${isOpen.value
          ? 'bg-white/95 dark:bg-slate-900/80 border-red-500/30 shadow-2xl'
          : 'bg-white/80 dark:bg-slate-900/40 border-gray-300/80 dark:border-white/5 shadow-2xl shadow-gray-400/20 dark:shadow-none hover:border-red-500/30'}`}
      >
        <div
          class={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shrink-0 border transition-all duration-700 ${isOpen.value ? 'rotate-12 scale-110 bg-red-600 border-red-500 text-white' : colorMap[group.color]}`}
        >
          <span class={`text-3xl transition-transform duration-500 ${isOpen.value ? 'scale-110 text-white' : ''}`}>{group.icon}</span>
        </div>
        <div class="flex-1 text-left">
          <h3 class={`font-black text-lg lg:text-xl leading-none uppercase tracking-tight transition-colors ${isOpen.value ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {group.title}
          </h3>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">{group.desc}</p>
        </div>
        <div class={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isOpen.value ? 'bg-red-600 rotate-90 scale-110' : 'bg-gray-50 dark:bg-white/5'}`}>
          <span class={`text-xl font-black transition-colors ${isOpen.value ? 'text-white' : 'text-gray-300 dark:text-slate-600'}`}>›</span>
        </div>
      </button>

      <div class={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen.value ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div class="grid grid-cols-1 gap-1 pl-4 border-l-2 border-red-600/10">
          {group.items?.map((item) => (
            <ListItem key={item.id} item={item} isNested />
          ))}
        </div>
      </div>
    </div>
  );
});

export default component$(() => {
  return (
    <div class="min-h-screen">
      <div class="max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* Grid Pulsanti senza sezioni */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-10">
          {menuItems.map((item) =>
            item.isAccordion ? (
              <div key={item.id} class="md:col-span-2">
                <AccordionItem group={item} />
              </div>
            ) : (
              <ListItem key={item.id} item={item} />
            )
          )}
        </div>
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
        'Portale completo per lo studio del Judo: tecniche, kata, dizionario, quiz e strumenti di apprendimento.',
    },
  ],
};