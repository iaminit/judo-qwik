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
    const slug = titolo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `tecnica-${Date.now()}`;

    const data = new FormData();
    data.append('titolo', titolo);
    data.append('slug', slug);
    data.append('titolo_secondario', formData.get('titolo_secondario') as string || '');
    data.append('descrizione_breve', formData.get('descrizione_breve') as string || '');
    data.append('contenuto', formData.get('contenuto') as string || '');
    data.append('categoria_secondaria', formData.get('categoria_secondaria') as string || '');
    data.append('video_link', formData.get('video_link') as string || '');

    const ordineVal = formData.get('ordine');
    if (ordineVal !== null && ordineVal !== '') {
      data.append('ordine', ordineVal as string);
    }

    const livelloVal = formData.get('livello');
    if (livelloVal !== null && livelloVal !== '') {
      data.append('livello', livelloVal as string);
    }

    data.append('pubblicato', formData.get('pubblicato') === 'on' ? 'true' : 'false');
    data.append('in_evidenza', formData.get('in_evidenza') === 'on' ? 'true' : 'false');

    const imgFile = formData.get('immagine_principale') as File;
    if (imgFile && imgFile.size > 0) {
      data.append('immagine_principale', imgFile);
    }
    mergeContentFormData(formData, data);

    try {
      await pbAdmin.collection('tecniche').create(data);
      success.value = true;
      form.reset();
      setTimeout(() => {
        nav('/gestione/tecniche');
      }, 1500);
    } catch (err: any) {
      console.error('[Gestione Tecniche] Error:', err);
      error.value = err.message || 'Impossibile salvare la tecnica';
    } finally {
      isSaving.value = false;
    }
  });

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-black" style={{ color: 'var(--color-text)' }}>
          Nuova Tecnica (Gokyo)
        </h1>
        <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Inserisci i dettagli della nuova tecnica nel database.
        </p>
      </div>

      {error.value && (
        <div class="p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-semibold">
          ⚠️ {error.value}
        </div>
      )}

      {success.value && (
        <div class="p-4 mb-6 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 text-sm font-semibold">
          ✅ Tecnica salvata con successo! Reindirizzamento in corso...
        </div>
      )}

      <form onSubmit$={handleSubmit} class="space-y-6 bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Nome Tecnica (Gaiji / Rōmaji) *
            </label>
            <input
              type="text"
              name="titolo"
              required
              placeholder="es. Seoi-Nage"
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Nome in Kanji / Traduzione
            </label>
            <input
              type="text"
              name="titolo_secondario"
              placeholder="es. 背負投 / Proiezione a spalla"
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Gruppo / Categoria (es. Dai-Ikkyo, Te-Waza)
            </label>
            <input
              type="text"
              name="categoria_secondaria"
              placeholder="es. Te-Waza, Dai-Ikkyo"
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Numero Ordine (Gokyo 1-67)
            </label>
            <input
              type="number"
              name="ordine"
              placeholder="1"
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Livello / Grado (Kyu/Dan)
            </label>
            <input
              type="number"
              name="livello"
              placeholder="5"
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Link Video Tutorial (YouTube / Vimeo URL)
          </label>
          <input
            type="url"
            name="video_link"
            placeholder="https://www.youtube.com/watch?v=..."
            class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Descrizione Sintetica
          </label>
          <input
            type="text"
            name="descrizione_breve"
            placeholder="Breve spiegazione del principio di esecuzione"
            class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Analisi Dettagliata (Kuzushi, Tsukuri, Kake)
          </label>
          <textarea
            name="contenuto"
            rows={6}
            placeholder="Descrivi dettagliatamente le fasi di squilibrio, caricamento ed esecuzione..."
            class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Immagine o Illustrazione
          </label>
          <input
            type="file"
            name="immagine_principale"
            accept="image/*"
            class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
          />
        </div>

        <div class="flex items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="pubblicato" defaultChecked class="w-4 h-4 text-red-600 rounded" />
            <span class="text-sm font-semibold">Pubblicata</span>
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
            'video_link',
            'ordine',
            'livello',
            'immagine_principale',
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
            {isSaving.value ? 'Salvataggio...' : 'Salva Tecnica'}
          </button>
        </div>
      </form>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Nuova Tecnica - Gestione JudoOK',
};
