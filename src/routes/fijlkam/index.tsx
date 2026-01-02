import { component$, useSignal, $, useContext, useVisibleTask$, useComputed$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';

interface FijlkamItem {
  id: string;
  titolo: string;
  contenuto: string;
  categoria_secondaria?: string;
}

interface TimelineItem {
  id: string;
  anno: number;
  titolo: string;
  contenuto: string;
}

interface Regulation {
  id: string;
  titolo: string;
  titolo_secondario?: string;
  contenuto: string;
  link_esterno?: string;
}

interface ExamProgram {
  id: string;
  livello: number;
  categoria_secondaria: string;
  titolo: string;
  contenuto: string;
  ordine: number;
}

export const useFijlkamData = routeLoader$(async () => {
  try {
    console.log('[Fijlkam] Fetching from PocketBase (unified)...');

    // Fetch all items from the unified collection
    const [infoResult, tlResult, regResult, programsResult] = await Promise.allSettled([
      pb.collection('programmi_fijlkam').getFullList({
        filter: 'tags ~ "info"',
        sort: 'ordine',
        requestKey: null
      }),
      pb.collection('programmi_fijlkam').getFullList({
        filter: 'anno != null',
        sort: 'anno',
        requestKey: null
      }),
      pb.collection('programmi_fijlkam').getFullList({
        filter: 'tags ~ "regolamento"',
        sort: 'titolo',
        requestKey: null
      }),
      pb.collection('programmi_fijlkam').getFullList({
        filter: 'tags ~ "esame_dan"',
        sort: 'ordine',
        requestKey: null
      }),
    ]);

    const items = infoResult.status === 'fulfilled' ? (infoResult.value as any[]) : [];
    const timelineItems = tlResult.status === 'fulfilled' ? (tlResult.value as any[]) : [];
    const regulations = regResult.status === 'fulfilled' ? (regResult.value as any[]) : [];
    const programs = programsResult.status === 'fulfilled' ? (programsResult.value as any[]) : [];

    return {
      items,
      timelineItems,
      regulations,
      programs,
    };
  } catch (err) {
    console.error('[Fijlkam] Error loading data:', err);
    return {
      items: [],
      timelineItems: [],
      regulations: [],
      programs: [],
      error: 'Impossibile caricare i dati. Riprova più tardi.',
    };
  }
});

// Timeline component with expand/collapse for FIJLKAM
interface FijlkamTimelineProps {
  items: TimelineItem[];
}

const FijlkamTimeline = component$<FijlkamTimelineProps>(({ items }) => {
  const isExpanded = useSignal(false);

  const toggleExpanded = $(() => {
    isExpanded.value = !isExpanded.value;
  });

  return (
    <>
      {/* Show timeline only when expanded */}
      {isExpanded.value && (
        <div class="relative border-l-4 border-blue-200 dark:border-blue-900/50 ml-6 md:ml-12 space-y-10 pb-8 animate-in fade-in slide-in-from-top duration-500">
          {items.map((item, index) => (
            <div
              key={item.id}
              class="relative pl-8 md:pl-12 group animate-in fade-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Dot */}
              <div class="absolute -left-[11px] top-2 w-6 h-6 rounded-full bg-blue-600 border-4 border-white dark:border-gray-900 group-hover:scale-125 transition-transform"></div>

              <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all">
                <span class="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold mb-3 shadow-md">
                  {item.anno}
                </span>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.titolo}</h3>
                <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{item.contenuto}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expand/Collapse Button */}
      <div class="text-center mt-8">
        <button
          onClick$={toggleExpanded}
          class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <span>
            {isExpanded.value
              ? 'Nascondi cronologia'
              : `Mostra cronologia (${items.length} eventi)`}
          </span>
          <svg
            class={`w-5 h-5 transition-transform duration-300 ${isExpanded.value ? 'rotate-180' : ''
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </>
  );
});

export default component$(() => {
  const data = useFijlkamData();

  const activeTab = useSignal<
    'info' | 'champions' | 'belts' | 'comitato' | 'arbitraggio' | 'history' | 'programmi'
  >('info');
  const activeDan = useSignal(1);
  const appState = useContext(AppContext);

  useVisibleTask$(() => {
    appState.sectionTitle = 'FIJLKAM';
    appState.sectionIcon = '🇮🇹';
  });

  // Filter programs by active dan level
  const filteredPrograms = useComputed$(() => {
    return data.value.programs.filter((program) => program.livello === activeDan.value);
  });

  // Get unique dan levels from data
  const availableDans = useComputed$(() => {
    const dans = new Set(data.value.programs.map((p) => p.livello));
    return Array.from(dans).sort((a, b) => a - b);
  });

  // Separate items by section field (from DB) or fallback to ID matching
  const infoItems = data.value.items.filter((item) => item.categoria_secondaria === 'info');
  const infoItem =
    infoItems[0] || data.value.items.find((item) => item.id === 'f1') || data.value.items[0];
  const structureItem =
    infoItems[1] || data.value.items.find((item) => item.id === 'f2') || data.value.items[1];
  const championsItem =
    data.value.items.find((item) => item.categoria_secondaria === 'campioni') ||
    data.value.items.find((item) => item.id === 'f3') ||
    data.value.items[2];
  const beltsItem =
    data.value.items.find((item) => item.categoria_secondaria === 'cinture') ||
    data.value.items.find((item) => item.id === 'f4') ||
    data.value.items[3];
  const comitatoItem =
    data.value.items.find((item) => item.categoria_secondaria === 'comitati') ||
    data.value.items.find((item) => item.id === 'f5') ||
    data.value.items[4];

  return (
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Tabs */}
      <div class="flex justify-center gap-2 flex-wrap">
        <button
          onClick$={() => {
            activeTab.value = 'info';
          }}
          class={`px-6 py-3 rounded-full font-bold transition-all ${activeTab.value === 'info'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          ℹ️ Info
        </button>
        <button
          onClick$={() => {
            activeTab.value = 'champions';
          }}
          class={`px-6 py-3 rounded-full font-bold transition-all ${activeTab.value === 'champions'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          🏆 Campioni
        </button>
        <button
          onClick$={() => {
            activeTab.value = 'belts';
          }}
          class={`px-6 py-3 rounded-full font-bold transition-all ${activeTab.value === 'belts'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          🥋 Cinture
        </button>
        <button
          onClick$={() => {
            activeTab.value = 'comitato';
          }}
          class={`px-6 py-3 rounded-full font-bold transition-all ${activeTab.value === 'comitato'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          🗺️ Comitati
        </button>
        <button
          onClick$={() => {
            activeTab.value = 'arbitraggio';
          }}
          class={`px-6 py-3 rounded-full font-bold transition-all ${activeTab.value === 'arbitraggio'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          ⚖️ Arbitraggio
        </button>
        <button
          onClick$={() => {
            activeTab.value = 'history';
          }}
          class={`px-6 py-3 rounded-full font-bold transition-all ${activeTab.value === 'history'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          📅 Storia
        </button>
        <button
          onClick$={() => {
            activeTab.value = 'programmi';
          }}
          class={`px-6 py-3 rounded-full font-bold transition-all ${activeTab.value === 'programmi'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          📚 Programmi d'Esame
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab.value === 'info' && (
        <div class="space-y-8">
          {infoItem && (
            <article class="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {infoItem.titolo}
              </h2>
              <div
                class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                dangerouslySetInnerHTML={infoItem.contenuto}
              />
            </article>
          )}

          {structureItem && (
            <article class="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {structureItem.titolo}
              </h2>
              <div
                class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                dangerouslySetInnerHTML={structureItem.contenuto}
              />
            </article>
          )}
        </div>
      )}

      {activeTab.value === 'champions' && championsItem && (
        <article class="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {championsItem.titolo}
          </h2>
          <div
            class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
            dangerouslySetInnerHTML={championsItem.contenuto}
          />
        </article>
      )}

      {activeTab.value === 'belts' && beltsItem && (
        <article class="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">{beltsItem.titolo}</h2>
          <div
            class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
            dangerouslySetInnerHTML={beltsItem.contenuto}
          />
        </article>
      )}

      {activeTab.value === 'comitato' && comitatoItem && (
        <article class="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {comitatoItem.titolo}
          </h2>
          <div
            class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
            dangerouslySetInnerHTML={comitatoItem.contenuto}
          />
        </article>
      )}

      {activeTab.value === 'arbitraggio' && data.value.regulations.length > 0 && (
        <div class="space-y-8">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Regolamento e Arbitraggio
            </h2>
            <p class="text-gray-600 dark:text-gray-400">Norme ufficiali di gara e categorie</p>
          </div>

          {data.value.regulations.map((item) => (
            <article
              key={item.id}
              class="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700"
            >
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {item.titolo}
                  </h3>
                  {item.titolo_secondario && (
                    <h4 class="text-lg text-yellow-600 dark:text-yellow-400 font-medium">
                      {item.titolo_secondario}
                    </h4>
                  )}
                </div>
                {item.link_esterno && (
                  <a
                    href={item.link_esterno}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="shrink-0 flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors text-sm font-medium"
                    title="Link al regolamento ufficiale"
                  >
                    🔗 Regolamento IJF
                  </a>
                )}
              </div>

              <div
                class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                dangerouslySetInnerHTML={item.contenuto}
              />
            </article>
          ))}
        </div>
      )}

      {activeTab.value === 'history' && (
        <section>
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Cronologia Storica
            </h2>
            <p class="text-gray-600 dark:text-gray-400">Le tappe fondamentali della FIJLKAM</p>
          </div>

          {data.value.timelineItems.length > 0 ? (
            <FijlkamTimeline items={data.value.timelineItems} />
          ) : (
            <div class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400">Nessun evento storico disponibile.</p>
            </div>
          )}
        </section>
      )}

      {activeTab.value === 'programmi' && (
        <div class="space-y-8">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Programmi d'Esame DAN
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              Requisiti tecnici, teorici e pratici per gli esami di grado
            </p>
          </div>

          {/* Dan Selector */}
          <div class="flex flex-wrap justify-center gap-3">
            {availableDans.value.map((dan) => (
              <button
                key={dan}
                onClick$={() => (activeDan.value = dan)}
                class={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-sm ${activeDan.value === dan
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
              >
                {dan}° DAN
              </button>
            ))}
          </div>

          {/* Programs Path - Sequential Learning Style */}
          <div class="relative pl-8 md:pl-16 space-y-12 mb-20">
            {/* Vertical Path Line */}
            <div class="absolute left-[39px] md:left-[71px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-600 via-blue-400 to-transparent opacity-20 dark:opacity-40"></div>

            {filteredPrograms.value.length > 0 ? (
              filteredPrograms.value.map((program, index) => (
                <div
                  key={program.id}
                  class="relative group animate-in fade-in slide-in-from-left duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Step Index Circle */}
                  <div class="absolute -left-[31px] md:-left-[47px] top-4 w-5 h-5 md:w-8 md:h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-600 z-10 flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-125 transition-all duration-300">
                    <span class="text-[8px] md:text-[10px] font-black text-blue-600 group-hover:text-white">{index + 1}</span>
                  </div>

                  <div class="surface-elevated p-6 md:p-8 hover:bg-white/60 dark:hover:bg-white/10">
                    {/* Section Type Badge */}
                    {program.categoria_secondaria && (
                      <div class="mb-4 flex items-center gap-3">
                        <span class="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                          {program.categoria_secondaria}
                        </span>
                        <div class="h-px flex-1 bg-gray-100 dark:bg-white/5"></div>
                      </div>
                    )}

                    {/* Title */}
                    <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">
                      {program.titolo}
                    </h3>

                    {/* Content */}
                    {program.contenuto && (
                      <div
                        class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                        dangerouslySetInnerHTML={program.contenuto}
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div class="text-center py-16 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border-2 border-dashed border-blue-200 dark:border-blue-800/30">
                <div class="text-6xl mb-4">📚</div>
                <h3 class="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-widest">In arrivo</h3>
                <p class="text-gray-500 dark:text-gray-400">
                  Stiamo caricando i dettagli tecnici per il {activeDan.value}° DAN.
                </p>
              </div>
            )}
          </div>

          {/* Info Box */}
          {filteredPrograms.value.length > 0 && (
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-8 border border-blue-200 dark:border-blue-800/30">
              <h3 class="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                </svg>
                Informazioni sul Programma
              </h3>
              <div class="text-blue-800 dark:text-blue-200">
                <p>
                  Il programma d'esame per il {activeDan.value}° DAN include requisiti tecnici,
                  teorici e pratici secondo le direttive FIJLKAM.
                </p>
                <p class="mt-2">
                  Consulta attentamente ogni sezione per prepararti al meglio per l'esame.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* External Link */}
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white text-center">
        <h3 class="text-xl font-bold mb-2">Sito Ufficiale FIJLKAM</h3>
        <p class="mb-4 text-blue-100">
          Per informazioni ufficiali, regolamenti e calendario gare
        </p>
        <a
          href="https://www.fijlkam.it"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors"
        >
          Visita fijlkam.it ↗
        </a>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'FIJLKAM - Federazione Italiana Judo',
  meta: [
    {
      name: 'description',
      content:
        'Informazioni sulla FIJLKAM: storia, regolamenti, arbitraggio, campioni italiani e programmi d\'esame DAN del Judo.',
    },
  ],
};
