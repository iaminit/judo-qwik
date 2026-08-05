import { component$, useSignal, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate, Link, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { MediaBrowserModal } from '~/components/admin/media-browser-modal';
import RichTextEditor from '~/components/admin/rich-text-editor';
import CompleteContentFields from '~/components/admin/complete-content-fields';
import { mergeContentFormData } from '~/lib/content-form-data';

interface TechniqueItem {
  name: string;
  file: string;
}

const DEFAULT_KATA_THUMBNAILS: Record<string, TechniqueItem[]> = {
  'katame-no-kata': [
    { name: 'Kesa Gatame', file: 'katame-kesa-gatame.webp' },
    { name: 'Kata Gatame', file: 'katame-kata-gatame.webp' },
    { name: 'Kami Shiho Gatame', file: 'katame-kami-shiho-gatame.webp' },
    { name: 'Yoko Shiho Gatame', file: 'katame-yoko-shiho-gatame.webp' },
    { name: 'Kuzure Kami Shiho Gatame', file: 'katame-kuzure-kami-shiho-gatame.webp' },
    { name: 'Kata Juji Jime', file: 'katame-kata-juji-jime.webp' },
    { name: 'Hadaka Jime', file: 'katame-hadaka-jime.webp' },
    { name: 'Okuri Eri Jime', file: 'katame-okuri-eri-jime.webp' },
    { name: 'Kata Ha Jime', file: 'katame-kata-ha-jime.webp' },
    { name: 'Gyaku Juji Jime', file: 'katame-gyaku-juji-jime.webp' },
    { name: 'Ude Garami', file: 'katame-ude-garami.webp' },
    { name: 'Ude Hishigi Juji Gatame', file: 'katame-ude-hishigi-juji-gatame.webp' },
    { name: 'Ude Hishigi Ude Gatame', file: 'katame-ude-hishigi-ude-gatame.webp' },
    { name: 'Ude Hishigi Hiza Gatame', file: 'katame-ude-hishigi-hiza-gatame.webp' },
    { name: 'Ashi Garami', file: 'katame-ashi-garami.webp' },
  ],
  'ju-no-kata': [
    { name: 'Tsuki Dashi', file: 'ju-no-kata-tsuki-dashi.webp' },
    { name: 'Kata Oshi', file: 'ju-no-kata-kata-oshi.webp' },
    { name: 'Ryote Dori', file: 'ju-no-kata-ryote-dori.webp' },
    { name: 'Kata Mawashi', file: 'ju-no-kata-kata-mawashi.webp' },
    { name: 'Ago Oshi', file: 'ju-no-kata-ago-oshi.webp' },
    { name: 'Kiri Oroshi', file: 'ju-no-kata-kiri-oroshi.webp' },
    { name: 'Ryokata Oshi', file: 'ju-no-kata-ryokata-oshi.webp' },
    { name: 'Naname Uchi', file: 'ju-no-kata-naname-uchi.webp' },
    { name: 'Katate Dori', file: 'ju-no-kata-katate-dori.webp' },
    { name: 'Katate Age', file: 'ju-no-kata-katate-age.webp' },
    { name: 'Obi Tori', file: 'ju-no-kata-obi-tori.webp' },
    { name: 'Mune Oshi', file: 'ju-no-kata-mune-oshi.webp' },
    { name: 'Tsuki Age', file: 'ju-no-kata-tsuki-age.webp' },
    { name: 'Uchi Oroshi', file: 'ju-no-kata-uchi-oroshi.webp' },
    { name: 'Ryogan Tsuki', file: 'ju-no-kata-ryogan-tsuki.webp' },
  ],
  'kodokan-goshin-jutsu': [
    { name: 'Ryote Dori', file: 'goshin-ryote-dori.webp' },
    { name: 'Hidari Eri Dori', file: 'goshin-hidari-eri-dori.webp' },
    { name: 'Migi Eri Dori', file: 'goshin-migi-eri-dori.webp' },
    { name: 'Kataude Dori', file: 'goshin-kataude-dori.webp' },
    { name: 'Ushiro Eri Dori', file: 'goshin-ushiro-eri-dori.webp' },
    { name: 'Ushiro Jime', file: 'goshin-ushiro-jime.webp' },
    { name: 'Kakae Dori', file: 'goshin-kakae-dori.webp' },
    { name: 'Naname Uchi', file: 'goshin-naname-uchi.webp' },
    { name: 'Ago Tsuki', file: 'goshin-ago-tsuki.webp' },
    { name: 'Gammen Tsuki', file: 'goshin-gammen-tsuki.webp' },
    { name: 'Mae Geri', file: 'goshin-mae-geri.webp' },
    { name: 'Yoko Geri', file: 'goshin-yoko-geri.webp' },
    { name: 'Daga Tsukkake', file: 'goshin-daga-tsukkake.webp' },
    { name: 'Daga Choku Tsuki', file: 'goshin-daga-choku-tsuki.webp' },
    { name: 'Daga Naname Tsuki', file: 'goshin-daga-naname-tsuki.webp' },
    { name: 'Bastone Furiage', file: 'goshin-bastone-furiage.webp' },
    { name: 'Bastone Furioroshi', file: 'goshin-bastone-furioroshi.webp' },
    { name: 'Bastone Morote Tsuki', file: 'goshin-bastone-morote-tsuki.webp' },
    { name: 'Pistola Shomen Zuke', file: 'goshin-pistola-shomen-zuke.webp' },
    { name: 'Pistola Koshi Gamae', file: 'goshin-pistola-koshi-gamae.webp' },
    { name: 'Pistola Haimen Zuke', file: 'goshin-pistola-haimen-zuke.webp' },
  ],
};

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
  const activeSeqIndex = useSignal<number | null>(null);

  const itemState = useStore<Record<string, any>>({});
  const techniquesList = useSignal<TechniqueItem[]>([]);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    try {
      const record = await pbAdmin.collection('kata').getOne(id, { requestKey: null });
      Object.assign(itemState, record);

      // Load techniques sequence
      if (record.tecniche_singole) {
        try {
          const parsed = typeof record.tecniche_singole === 'string' ? JSON.parse(record.tecniche_singole) : record.tecniche_singole;
          if (Array.isArray(parsed) && parsed.length > 0) {
            techniquesList.value = parsed;
          } else {
            techniquesList.value = DEFAULT_KATA_THUMBNAILS[record.slug] || [];
          }
        } catch (e) {
          techniquesList.value = DEFAULT_KATA_THUMBNAILS[record.slug] || [];
        }
      } else {
        techniquesList.value = DEFAULT_KATA_THUMBNAILS[record.slug] || [];
      }
    } catch (err: any) {
      console.error('[Gestione Kata Edit] Fetch error:', err);
      error.value = 'Impossibile caricare il record selezionato';
    } finally {
      isLoading.value = false;
    }
  });

  const handleMediaSelect = $((fileName: string) => {
    if (activeSeqIndex.value !== null) {
      const list = [...techniquesList.value];
      list[activeSeqIndex.value] = { ...list[activeSeqIndex.value], file: fileName };
      techniquesList.value = list;
      activeSeqIndex.value = null;
    } else {
      selectedMediaName.value = fileName;
      itemState.immagine_principale = fileName;
    }
    isMediaModalOpen.value = false;
  });

  const handleAddTechnique = $(() => {
    techniquesList.value = [
      ...techniquesList.value,
      { name: `Nuova Tecnica #${techniquesList.value.length + 1}`, file: '' }
    ];
  });

  const handleRemoveTechnique = $((index: number) => {
    techniquesList.value = techniquesList.value.filter((_, i) => i !== index);
  });

  const handleMoveUp = $((index: number) => {
    if (index === 0) return;
    const list = [...techniquesList.value];
    const temp = list[index - 1];
    list[index - 1] = list[index];
    list[index] = temp;
    techniquesList.value = list;
  });

  const handleMoveDown = $((index: number) => {
    if (index === techniquesList.value.length - 1) return;
    const list = [...techniquesList.value];
    const temp = list[index + 1];
    list[index + 1] = list[index];
    list[index] = temp;
    techniquesList.value = list;
  });

  const handleItemChange = $((index: number, key: 'name' | 'file', val: string) => {
    const list = [...techniquesList.value];
    list[index] = { ...list[index], [key]: val };
    techniquesList.value = list;
  });

  const handleSubmit = $(async (e: Event) => {
    e.preventDefault();
    isSaving.value = true;
    error.value = null;
    success.value = false;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const titolo = formData.get('titolo') as string;
    const slug = titolo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || itemState.slug || `kata-${Date.now()}`;

    const data = new FormData();
    data.append('titolo', titolo);
    data.append('slug', slug);
    data.append('titolo_secondario', formData.get('titolo_secondario') as string || '');
    data.append('descrizione_breve', formData.get('descrizione_breve') as string || '');
    data.append('contenuto', formData.get('contenuto') as string || '');
    data.append('categoria_secondaria', formData.get('categoria_secondaria') as string || '');
    data.append('video_link', formData.get('video_link') as string || '');

    const livelloVal = formData.get('livello');
    if (livelloVal !== null && livelloVal !== '') {
      data.append('livello', livelloVal as string);
    }

    // Save techniques sequence as JSON string
    data.append('tecniche_singole', JSON.stringify(techniquesList.value));

    data.append('pubblicato', formData.get('pubblicato') === 'on' ? 'true' : 'false');
    data.append('in_evidenza', formData.get('in_evidenza') === 'on' ? 'true' : 'false');
    mergeContentFormData(formData, data);

    const fileInput = form.querySelector('input[type="file"][name="immagine_principale_file"]') as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      data.append('immagine_principale', fileInput.files[0]);
    }

    try {
      await pbAdmin.collection('kata').update(id, data);
      success.value = true;
      setTimeout(() => {
        nav('/gestione/kata');
      }, 1200);
    } catch (err: any) {
      console.error('[Gestione Kata Edit] Update error:', err);
      error.value = err.message || 'Impossibile aggiornare il kata';
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

  const resolveThumbUrl = (filePath: string) => {
    if (!filePath) return '/media/kano_non_sa.webp';
    if (filePath.startsWith('http') || filePath.startsWith('/')) return filePath;
    return `/media/kata_thumbs/${filePath}`;
  };

  const previewImageSrc = getImageUrl(selectedMediaName.value || itemState.immagine_principale);

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-black" style={{ color: 'var(--color-text)' }}>
          Modifica Kata: {itemState.titolo || ''}
        </h1>
        <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Gestisci dettagli, sequenza ordinata delle tecniche singole ed editor avanzato.
        </p>
      </div>

      {error.value && (
        <div class="p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-semibold">
          ⚠️ {error.value}
        </div>
      )}

      {success.value && (
        <div class="p-4 mb-6 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 text-sm font-semibold">
          ✅ Kata e sequenza tecniche aggiornati con successo! Reindirizzamento...
        </div>
      )}

      <form onSubmit$={handleSubmit} class="space-y-6 bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Nome Kata *
            </label>
            <input
              type="text"
              name="titolo"
              required
              value={itemState.titolo || ''}
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none font-bold"
            />
          </div>

          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Kanji / Significato
            </label>
            <input
              type="text"
              name="titolo_secondario"
              value={itemState.titolo_secondario || ''}
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Categoria / Tipo (es. Randori-no-Kata)
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
              Livello Dan (es. 1, 2, 3)
            </label>
            <input
              type="number"
              name="livello"
              min={1}
              max={10}
              value={itemState.livello || ''}
              class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Link Video Ufficiale (YouTube / Vimeo URL)
          </label>
          <input
            type="url"
            name="video_link"
            placeholder="https://www.youtube.com/watch?v=..."
            value={itemState.video_link || ''}
            class="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Introduzione e Principi
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
            Sequenze e Dettaglio Tecniche (Editor Completo Quill)
          </label>
          <RichTextEditor
            id="contenuto"
            name="contenuto"
            value={itemState.contenuto || ''}
            placeholder="Descrivi dettagliatamente le sequenze, i ruoli e le tecniche..."
            mediaFolder="kata"
          />
        </div>

        {/* Immagine Copertina + Media Browser Picker */}
        <div class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
          <label class="block text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Immagine Copertina / Diagramma
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
              onClick$={() => {
                activeSeqIndex.value = null;
                isMediaModalOpen.value = true;
              }}
              class="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black text-xs font-extrabold rounded-xl shadow hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <span>🖼️</span> Sfoglia Libreria Media
            </button>
          </div>
        </div>

        {/* 🎯 Interactive Sequential Techniques Manager */}
        <div class="p-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2 m-0">
                <span>🎯</span> Sequenza Tecniche Singole ({techniquesList.value.length})
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 m-0">
                Ordina, modifica il nome, cambia l'immagine o aggiungi nuove tecniche alla sequenza del Kata.
              </p>
            </div>

            <button
              type="button"
              onClick$={handleAddTechnique}
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>+</span> Aggiungi Tecnica
            </button>
          </div>

          {techniquesList.value.length === 0 ? (
            <div class="text-center py-6 text-sm text-gray-400">
              Nessuna tecnica in sequenza. Clicca su "+ Aggiungi Tecnica" per iniziare.
            </div>
          ) : (
            <div class="space-y-3">
              {techniquesList.value.map((item, idx) => (
                <div
                  key={idx}
                  class="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  {/* Sequence Badge & Thumbnail */}
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="w-7 h-7 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-extrabold text-xs">
                      #{idx + 1}
                    </span>
                    <img
                      src={resolveThumbUrl(item.file)}
                      alt={item.name}
                      class="w-12 h-12 object-contain bg-white rounded-lg border border-gray-200 p-0.5"
                      onError$={(e) => {
                        (e.target as HTMLImageElement).src = '/media/kano_non_sa.webp';
                      }}
                    />
                  </div>

                  {/* Name & File Inputs */}
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 grow">
                    <div>
                      <label class="block text-[10px] font-black uppercase text-gray-400 mb-0.5">Nome Tecnica</label>
                      <input
                        type="text"
                        value={item.name}
                        onInput$={(e) => handleItemChange(idx, 'name', (e.target as HTMLInputElement).value)}
                        placeholder="es. Kesa Gatame"
                        class="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-semibold"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] font-black uppercase text-gray-400 mb-0.5">File Immagine / URL</label>
                      <input
                        type="text"
                        value={item.file}
                        onInput$={(e) => handleItemChange(idx, 'file', (e.target as HTMLInputElement).value)}
                        placeholder="es. katame-kesa-gatame.webp"
                        class="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Move & Action Controls */}
                  <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick$={() => {
                        activeSeqIndex.value = idx;
                        isMediaModalOpen.value = true;
                      }}
                      class="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                      title="Sfoglia Media"
                    >
                      <span>🖼️ Media</span>
                    </button>

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick$={() => handleMoveUp(idx)}
                      class="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 disabled:opacity-30 rounded-lg font-bold text-xs"
                      title="Sposta Su"
                    >
                      ⬆️
                    </button>

                    <button
                      type="button"
                      disabled={idx === techniquesList.value.length - 1}
                      onClick$={() => handleMoveDown(idx)}
                      class="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 disabled:opacity-30 rounded-lg font-bold text-xs"
                      title="Sposta Giù"
                    >
                      ⬇️
                    </button>

                    <button
                      type="button"
                      onClick$={() => handleRemoveTechnique(idx)}
                      class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-xs border border-red-200"
                      title="Elimina Tecnica"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            'titolo_secondario',
            'descrizione_breve',
            'contenuto',
            'categoria_secondaria',
            'video_link',
            'livello',
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
            href="/gestione/kata"
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
  title: 'Modifica Kata - Gestione JudoOK',
};
