import { component$, useSignal, useComputed$, useVisibleTask$, useContext } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';

interface ExamProgram {
  id: string;
  dan_level: number;
  section_type: string;
  title: string;
  content: string;
  order: number;
}

interface ProgramData {
  programs: ExamProgram[];
  error?: string;
}

export const useProgramData = routeLoader$<ProgramData>(async () => {
  try {
    console.log('[Program] Fetching exam programs from PocketBase...');
    let programs: any[] = [];
    try {
      programs = await pb.collection('livelli_dan').getFullList({
        sort: 'ordine',
        requestKey: null,
      });
    } catch {
      try {
        programs = await pb.collection('exam_program').getFullList({
          sort: 'order',
          requestKey: null,
        });
      } catch (e) {
        console.warn('[Program] Fetch failed:', e);
      }
    }

    const mapped = programs.map((p: any) => ({
      id: p.id,
      dan_level: p.grado || p.dan_level || 1,
      section_type: p.tipo || p.section_type || 'Kyu/Dan',
      title: p.nome_completo || p.cintura_colore || p.title || '',
      content: p.requisiti || p.content || p.description || '',
      order: p.ordine || p.order || 0,
    }));

    return {
      programs: mapped as unknown as ExamProgram[],
    };
  } catch (err) {
    console.error('[Program] Error loading exam programs:', err);
    return {
      programs: [],
      error: 'Impossibile caricare i programmi d\'esame. Riprova più tardi.',
    };
  }
});

export default component$(() => {
  const data = useProgramData();
  const activeDan = useSignal(1);
  const appState = useContext(AppContext);

  useVisibleTask$(() => {
    appState.sectionTitle = 'Programmi d\'Esame';
    appState.sectionIcon = '📚';
  });

  // Filter programs by active dan level
  const filteredPrograms = useComputed$(() => {
    return data.value.programs.filter((program) => program.dan_level === activeDan.value);
  });

  // Get unique dan levels from data
  const availableDans = useComputed$(() => {
    const dans = new Set(data.value.programs.map((p) => p.dan_level));
    return Array.from(dans).sort((a, b) => a - b);
  });

  return (
    <div class="max-w-5xl mx-auto px-4 py-8">
      {/* Error Message */}
      {data.value.error && (
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-8">
          <p class="text-red-800 dark:text-red-200 text-center font-medium">
            {data.value.error}
          </p>
        </div>
      )}

      {/* Dan Selector */}
      <div class="mb-8">
        <div class="flex flex-wrap justify-center gap-3">
          {availableDans.value.map((dan) => (
            <button
              key={dan}
              onClick$={() => (activeDan.value = dan)}
              class={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-sm ${
                activeDan.value === dan
                  ? 'bg-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500'
              }`}
            >
              {dan}° DAN
            </button>
          ))}
        </div>
      </div>

      {activeDan.value === 3 && (
        <div
          class="mb-8 rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div>
            <span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-black tracking-wider text-white bg-[var(--color-action)]">PDF UFFICIALE</span>
            <h2 class="text-lg font-black mt-2 mb-1" style={{ color: 'var(--color-text)' }}>
              Programma Tecnico Esame 3° Dan FIJLKAM 2026
            </h2>
            <p class="text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
              Consulta il documento completo con requisiti, Kata e programma tecnico.
            </p>
          </div>
          <a
            href="/downloads/Programma_Tecnico_Esame_3_Dan_Judo_FIJLKAM_20261.pdf"
            target="_blank"
            rel="noopener"
            class="min-h-12 px-5 rounded-xl inline-flex items-center justify-center text-white font-black no-underline shrink-0 pressable bg-[var(--color-action)]"
          >
            Apri il PDF
          </a>
        </div>
      )}

      {/* Programs List */}
      <div class="space-y-6">
        {filteredPrograms.value.length > 0 ? (
          filteredPrograms.value.map((program) => (
            <div
              key={program.id}
              class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div class="p-6">
                {/* Section Type Badge */}
                {program.section_type && (
                  <div class="mb-4">
                    <span class="inline-block px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold uppercase tracking-wide">
                      {program.section_type}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {program.title}
                </h2>

                {/* Content */}
                {program.content && (
                  <div
                    class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                    dangerouslySetInnerHTML={program.content}
                  />
                )}
              </div>
            </div>
          ))
        ) : (
          <div class="text-center py-16">
            <div class="text-6xl mb-4">📚</div>
            <h3 class="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
              Nessun programma disponibile
            </h3>
            <p class="text-gray-500 dark:text-gray-400">
              Non ci sono programmi d'esame per il {activeDan.value}° DAN.
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      {filteredPrograms.value.length > 0 && (
        <div class="mt-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-8 border border-indigo-200 dark:border-indigo-800/30">
          <h3 class="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            Informazioni sul Programma
          </h3>
          <div class="text-indigo-800 dark:text-indigo-200">
            <p>
              Il programma d'esame per il {activeDan.value}° DAN include requisiti tecnici, teorici
              e pratici secondo le direttive FIJLKAM.
            </p>
            <p class="mt-2">
              Consulta attentamente ogni sezione per prepararti al meglio per l'esame.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Programmi d\'Esame - JudoOK',
  meta: [
    {
      name: 'description',
      content:
        'Programmi d\'esame per i gradi DAN del Judo: requisiti tecnici, teorici e pratici secondo le direttive FIJLKAM.',
    },
  ],
};
