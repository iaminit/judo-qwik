import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import CompleteContentFields from '~/components/admin/complete-content-fields';
import { mergeContentFormData } from '~/lib/content-form-data';

export default component$(() => {
  const nav = useNavigate();
  const isSaving = useSignal(false);
  const error = useSignal<string | null>(null);
  const success = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    if (!pbAdmin.authStore.isValid) {
      nav('/gestione/login');
    }
  });

  const handleSubmit = $(async (e: Event) => {
    e.preventDefault();
    isSaving.value = true;
    error.value = null;
    success.value = false;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const titolo = formData.get('titolo') as string;
    const slug = titolo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `termine-${Date.now()}`;

    const data = new FormData();
    data.append('titolo', titolo);
    data.append('slug', slug);
    data.append('titolo_secondario', formData.get('titolo_secondario') as string || '');
    data.append('descrizione_breve', formData.get('descrizione_breve') as string || '');
    data.append('contenuto', formData.get('contenuto') as string || '');
    data.append('categoria_secondaria', formData.get('categoria_secondaria') as string || '');
    data.append('pubblicato', formData.get('pubblicato') === 'on' ? 'true' : 'false');
    data.append('in_evidenza', formData.get('in_evidenza') === 'on' ? 'true' : 'false');
    mergeContentFormData(formData, data);

    try {
      await pbAdmin.collection('dizionario').create(data);
      success.value = true;
      form.reset();
      setTimeout(() => {
        nav('/dizionario');
      }, 1500);
    } catch (err: any) {
      console.error('[Gestione Dizionario] Error:', err);
      error.value = err.message || 'Impossibile salvare il termine';
    } finally {
      isSaving.value = false;
    }
  });

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-black" style={{ color: 'var(--color-text)' }}>
          Nuovo Termine nel Dizionario
        </h1>
        <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Aggiungi una voce di glossario della terminologia nipponica.
        </p>
      </div>

      {error.value && (
        <div class="p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-semibold">
          ⚠️ {error.value}
        </div>
      )}

      {success.value && (
        <div class="p-4 mb-6 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 text-sm font-semibold">
          ✅ Termine salvato con successo! Reindirizzamento in corso...
        </div>
      )}

      <form onSubmit$={handleSubmit} class="space-y-6 bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Termine Giapponese (Rōmaji) *
            </label>
            <input
              type="text"
              name="titolo"
              required
              placeholder="es. Ukemi"
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Kanji / Ideogrammi
            </label>
            <input
              type="text"
              name="titolo_secondario"
              placeholder="es. 受身"
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Categoria (es. Cadute, Comandi, Abbigliamento)
          </label>
          <input
            type="text"
            name="categoria_secondaria"
            placeholder="es. Cadute"
            class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Definizione Sintetica
          </label>
          <input
            type="text"
            name="descrizione_breve"
            placeholder="Traduzione e significato in una frase"
            class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Spiegazione Approfondita ed Etimologia
          </label>
          <textarea
            name="contenuto"
            rows={6}
            placeholder="Spiegazione dettagliata dell'origine del termine, uso e contesti..."
            class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
          ></textarea>
        </div>

        <div class="flex items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="pubblicato" defaultChecked class="w-4 h-4 text-red-600 rounded" />
            <span class="text-sm font-semibold">Pubblicato</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="in_evidenza" class="w-4 h-4 text-red-600 rounded" />
            <span class="text-sm font-semibold">In Evidenza</span>
          </label>
        </div>

        <CompleteContentFields
          exclude={[
            'titolo',
            'titolo_secondario',
            'descrizione_breve',
            'contenuto',
            'categoria_secondaria',
            'pubblicato',
            'in_evidenza',
          ]}
        />

        <div class="pt-4">
          <button
            type="submit"
            disabled={isSaving.value}
            class="px-8 py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSaving.value ? 'Salvataggio...' : 'Salva Termine'}
          </button>
        </div>
      </form>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Nuovo Termine Dizionario - Gestione JudoOK',
};
