import { component$, useSignal, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate, Link, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { MediaBrowserModal } from '~/components/admin/media-browser-modal';
import RichTextEditor from '~/components/admin/rich-text-editor';
import CompleteContentFields from '~/components/admin/complete-content-fields';
import { mergeContentFormData } from '~/lib/content-form-data';

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const id = loc.params.id;

  const isSaving = useSignal(false);
  const isLoading = useSignal(true);
  const error = useSignal<string | null>(null);
  const success = useSignal(false);

  const isMediaModalOpen = useSignal(false);
  const selectedMediaName = useSignal<string>('');
  const itemState = useStore<Record<string, any>>({});

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    try {
      const record = await pbAdmin.collection('bacheca').getOne(id, { requestKey: null });
      Object.assign(itemState, record);
    } catch (err: any) {
      console.error('[Gestione Bacheca Edit] Fetch error:', err);
      error.value = 'Impossibile caricare il record selezionato';
    } finally {
      isLoading.value = false;
    }
  });

  const handleMediaSelect = $((fileName: string) => {
    selectedMediaName.value = fileName;
    itemState.immagine_principale = fileName;
    isMediaModalOpen.value = false;
  });

  const handleSubmit = $(async (e: Event) => {
    e.preventDefault();
    isSaving.value = true;
    error.value = null;
    success.value = false;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const titolo = formData.get('titolo') as string;
    const slug = titolo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || itemState.slug || `post-${Date.now()}`;

    const data = new FormData();
    data.append('titolo', titolo);
    data.append('slug', slug);
    data.append('descrizione_breve', formData.get('descrizione_breve') as string || '');
    data.append('contenuto', formData.get('contenuto') as string || '');
    data.append('categoria_secondaria', formData.get('categoria_secondaria') as string || '');
    data.append('pubblicato', formData.get('pubblicato') === 'on' ? 'true' : 'false');
    data.append('in_evidenza', formData.get('in_evidenza') === 'on' ? 'true' : 'false');
    data.append('data_riferimento', formData.get('data_riferimento') as string || new Date().toISOString().split('T')[0]);

    const fileInput = form.querySelector('input[type="file"][name="immagine_principale_file"]') as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      data.append('immagine_principale', fileInput.files[0]);
    }
    mergeContentFormData(formData, data);

    try {
      await pbAdmin.collection('bacheca').update(id, data);
      success.value = true;
      setTimeout(() => {
        nav('/gestione/bacheca');
      }, 1200);
    } catch (err: any) {
      console.error('[Gestione Bacheca Edit] Update error:', err);
      error.value = err.message || 'Impossibile aggiornare la notizia';
    } finally {
      isSaving.value = false;
    }
  });

  if (isLoading.value) {
    return <div class="p-12 text-center text-gray-500 font-medium">Caricamento in corso...</div>;
  }

  const getImageUrl = (imgName?: string) => {
    if (!imgName) return '';
    if (imgName.startsWith('http://') || imgName.startsWith('https://') || imgName.startsWith('/')) return imgName;
    if (itemState.collectionId && itemState.id) {
      return `https://judo.1ms.it/api/files/${itemState.collectionId}/${itemState.id}/${imgName}`;
    }
    return `/media/${imgName}`;
  };

  const previewImageSrc = getImageUrl(selectedMediaName.value || itemState.immagine_principale);

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-black" style={{ color: 'var(--color-text)' }}>
          Modifica Notizia: {itemState.titolo || ''}
        </h1>
        <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Modifica i dettagli del comunicato con editor WYSIWYG completo e selezione media.
        </p>
      </div>

      {error.value && (
        <div class="p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-semibold">
          ⚠️ {error.value}
        </div>
      )}

      {success.value && (
        <div class="p-4 mb-6 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 text-sm font-semibold">
          ✅ Notizia aggiornata con successo! Reindirizzamento...
        </div>
      )}

      <form onSubmit$={handleSubmit} class="space-y-6 bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Titolo *
          </label>
          <input
            type="text"
            name="titolo"
            required
            value={itemState.titolo || ''}
            class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none font-bold text-lg"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Descrizione Breve
          </label>
          <input
            type="text"
            name="descrizione_breve"
            value={itemState.descrizione_breve || ''}
            class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
          />
        </div>

        {/* Quill Rich Text Editor */}
        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Contenuto Completo Notizia (Editor Completo Quill)
          </label>
          <RichTextEditor
            id="contenuto"
            name="contenuto"
            value={itemState.contenuto || ''}
            placeholder="Scrivi il contenuto completo della notizia..."
            mediaFolder="bacheca"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Categoria / Tag
            </label>
            <input
              type="text"
              name="categoria_secondaria"
              value={itemState.categoria_secondaria || ''}
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Data Riferimento
            </label>
            <input
              type="date"
              name="data_riferimento"
              value={itemState.data_riferimento ? itemState.data_riferimento.split('T')[0] : ''}
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>
        </div>

        {/* Immagine Copertina + Media Browser Picker */}
        <div class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
          <label class="block text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Immagine Copertina
          </label>

          {previewImageSrc && (
            <div class="flex items-center gap-4 mb-2">
              <div class="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-white p-1 shrink-0 shadow-sm">
                <img src={previewImageSrc} alt="Miniatura Immagine" class="w-full h-full object-contain" />
              </div>
              <div class="text-xs text-gray-500">
                <p class="font-bold text-gray-800 dark:text-gray-200">Immagine associata:</p>
                <p class="font-mono text-[11px] truncate max-w-xs mt-0.5">{selectedMediaName.value || itemState.immagine_principale}</p>
              </div>
            </div>
          )}

          <div class="flex flex-wrap items-center gap-3">
            <input
              type="file"
              name="immagine_principale_file"
              accept="image/*"
              class="text-sm font-medium file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-600 hover:file:bg-red-100 transition-colors"
            />

            <button
              type="button"
              onClick$={() => (isMediaModalOpen.value = true)}
              class="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black text-xs font-extrabold rounded-xl shadow hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <span>🖼️</span> Sfoglia Libreria Media
            </button>
          </div>
        </div>

        <div class="flex items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="pubblicato"
              defaultChecked={itemState.pubblicato !== false}
              class="w-4 h-4 text-red-600 rounded"
            />
            <span class="text-sm font-semibold">Pubblicato</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="in_evidenza"
              defaultChecked={itemState.in_evidenza === true}
              class="w-4 h-4 text-red-600 rounded"
            />
            <span class="text-sm font-semibold">In Evidenza</span>
          </label>
        </div>

        <CompleteContentFields
          record={itemState}
          exclude={[
            'titolo',
            'descrizione_breve',
            'contenuto',
            'categoria_secondaria',
            'data_riferimento',
            'immagine_principale',
            'pubblicato',
            'in_evidenza',
          ]}
        />

        <div class="pt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving.value}
            class="px-8 py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSaving.value ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>

          <Link
            href="/gestione/bacheca"
            class="px-6 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Annulla
          </Link>
        </div>
      </form>

      {/* Media Browser Modal */}
      <MediaBrowserModal
        isOpen={isMediaModalOpen.value}
        onClose$={$(() => (isMediaModalOpen.value = false))}
        onSelect$={handleMediaSelect}
      />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Modifica Notizia - Gestione JudoOK',
};
