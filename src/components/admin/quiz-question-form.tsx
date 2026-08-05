import { $, component$, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { pbAdmin } from "~/lib/pocketbase-admin";
import { parsePbError } from "~/lib/error-parser";
import { MediaBrowserModal } from "./media-browser-modal";

interface QuizQuestionFormProps {
  item?: Record<string, any>;
  isNew: boolean;
}

const FIELD_CLASS = "w-full px-4 py-3 rounded-xl border outline-none";

const getQuizMediaUrl = (value: string) => {
  const media = value.trim();
  if (!media) return "";
  if (/^(?:https?:|data:|blob:)/i.test(media)) return media;
  return `/media/${media.replace(/^\/?media\//i, "").replace(/^\/+/, "")}`;
};

export default component$<QuizQuestionFormProps>(({ item, isNew }) => {
  const nav = useNavigate();
  const loading = useSignal(false);
  const error = useSignal("");
  const mediaPath = useSignal(String(item?.immagine || ""));
  const mediaPreview = useSignal(getQuizMediaUrl(String(item?.immagine || "")));
  const mediaModalOpen = useSignal(false);
  const mediaUploading = useSignal(false);
  const mediaInput = useSignal<HTMLInputElement>();

  const selectMedia = $((value: string) => {
    const normalized = value.replace(/^\/?media\//i, "").replace(/^\/+/, "");
    mediaPath.value = normalized;
    mediaPreview.value = getQuizMediaUrl(normalized);
    mediaModalOpen.value = false;
    if (mediaInput.value) mediaInput.value.value = "";
  });

  const updateMediaPath = $((event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    mediaPath.value = value;
    mediaPreview.value = getQuizMediaUrl(value);
  });

  const removeMedia = $(() => {
    mediaPath.value = "";
    mediaPreview.value = "";
    if (mediaInput.value) mediaInput.value.value = "";
  });

  const uploadMedia = $(async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      error.value = "Per le domande Quiz è possibile caricare solo immagini.";
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      error.value = "L’immagine supera il limite di 5 MB.";
      input.value = "";
      return;
    }

    mediaUploading.value = true;
    error.value = "";
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "quiz");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result?.error || "Caricamento non riuscito");

      const storedPath = String(result.fileName || result.url || "")
        .replace(/^\/?media\//i, "")
        .replace(/^\/+/, "");
      mediaPath.value = storedPath;
      mediaPreview.value = getQuizMediaUrl(storedPath);
    } catch (uploadError) {
      error.value = parsePbError(uploadError);
    } finally {
      mediaUploading.value = false;
    }
  });

  const save = $(async (event: Event) => {
    event.preventDefault();
    loading.value = true;
    error.value = "";
    const formData = new FormData(event.target as HTMLFormElement);
    const data = {
      domanda: String(formData.get("domanda") || "").trim(),
      opzione_a: String(formData.get("opzione_a") || "").trim(),
      opzione_b: String(formData.get("opzione_b") || "").trim(),
      opzione_c: String(formData.get("opzione_c") || "").trim(),
      opzione_d: String(formData.get("opzione_d") || "").trim(),
      risposta_corretta: Number(formData.get("risposta_corretta") || 1),
      spiegazione: String(formData.get("spiegazione") || "").trim(),
      immagine: String(formData.get("immagine") || "").trim(),
      categoria: String(formData.get("categoria") || "").trim(),
      livello_dan: String(formData.get("livello_dan") || "").trim(),
    };

    try {
      if (isNew) await pbAdmin.collection("domande_quiz").create(data);
      else await pbAdmin.collection("domande_quiz").update(item!.id, data);
      nav("/gestione/domande-quiz");
    } catch (saveError) {
      error.value = parsePbError(saveError);
    } finally {
      loading.value = false;
    }
  });

  return (
    <>
      <form
        onSubmit$={save}
        class="space-y-6 p-6 md:p-8 rounded-2xl border"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {error.value && (
          <p class="p-4 rounded-xl bg-red-50 text-red-700 font-bold">
            {error.value}
          </p>
        )}

        <label class="block space-y-2">
          <span class="block text-xs font-black uppercase">Domanda *</span>
          <textarea
            name="domanda"
            required
            rows={4}
            value={item?.domanda || ""}
            class={FIELD_CLASS}
          />
        </label>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(["a", "b", "c", "d"] as const).map((letter, index) => (
            <label key={letter} class="space-y-2">
              <span class="block text-xs font-black uppercase">
                Opzione {index + 1} *
              </span>
              <input
                name={`opzione_${letter}`}
                required
                value={item?.[`opzione_${letter}`] || ""}
                class={FIELD_CLASS}
              />
            </label>
          ))}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase">
              Risposta corretta *
            </span>
            <select name="risposta_corretta" class={FIELD_CLASS}>
              <option
                value="1"
                selected={String(item?.risposta_corretta || "1") === "1"}
              >
                Opzione 1
              </option>
              <option
                value="2"
                selected={String(item?.risposta_corretta || "1") === "2"}
              >
                Opzione 2
              </option>
              <option
                value="3"
                selected={String(item?.risposta_corretta || "1") === "3"}
              >
                Opzione 3
              </option>
              <option
                value="4"
                selected={String(item?.risposta_corretta || "1") === "4"}
              >
                Opzione 4
              </option>
            </select>
          </label>
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase">Categoria</span>
            <input
              name="categoria"
              value={item?.categoria || ""}
              placeholder="es. Kata"
              class={FIELD_CLASS}
            />
          </label>
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase">Livello DAN</span>
            <input
              name="livello_dan"
              value={item?.livello_dan || ""}
              placeholder="1, 2, 3..."
              class={FIELD_CLASS}
            />
          </label>
        </div>

        <label class="block space-y-2">
          <span class="block text-xs font-black uppercase">Spiegazione</span>
          <textarea
            name="spiegazione"
            rows={5}
            value={item?.spiegazione || ""}
            class={FIELD_CLASS}
          />
        </label>

        <section
          class="space-y-4 rounded-2xl border p-5"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface-alt)",
          }}
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span class="block text-xs font-black uppercase">
                Immagine della domanda
              </span>
              <span
                class="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Scegli dalla libreria oppure carica una nuova immagine.
              </span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                onClick$={() => (mediaModalOpen.value = true)}
                class="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold"
              >
                Sfoglia libreria
              </button>
              <input
                ref={mediaInput}
                type="file"
                accept="image/*"
                onChange$={uploadMedia}
                class="hidden"
              />
              <button
                type="button"
                disabled={mediaUploading.value}
                onClick$={() => mediaInput.value?.click()}
                class="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50"
              >
                {mediaUploading.value ? "Caricamento..." : "Carica nuova"}
              </button>
              {mediaPath.value && (
                <button
                  type="button"
                  onClick$={removeMedia}
                  class="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-bold"
                >
                  Rimuovi
                </button>
              )}
            </div>
          </div>

          {mediaPreview.value && (
            <div class="h-64 overflow-hidden rounded-2xl border bg-white">
              <img
                src={mediaPreview.value}
                alt="Anteprima domanda Quiz"
                class="w-full h-full object-contain p-3"
              />
            </div>
          )}

          <label class="block space-y-2">
            <span class="block text-xs font-black uppercase">
              URL o percorso media
            </span>
            <input
              name="immagine"
              value={mediaPath.value}
              onInput$={updateMediaPath}
              placeholder="es. kata_thumbs/goshin-ryote-dori.webp"
              class={FIELD_CLASS}
            />
          </label>
        </section>

        <div class="flex gap-3">
          <button
            type="submit"
            disabled={loading.value}
            class="px-6 py-3 rounded-xl bg-red-600 text-white font-bold disabled:opacity-50"
          >
            {loading.value ? "Salvataggio..." : "Salva domanda"}
          </button>
          <button
            type="button"
            onClick$={() => nav("/gestione/domande-quiz")}
            class="px-6 py-3 rounded-xl bg-gray-100 font-bold"
          >
            Annulla
          </button>
        </div>
      </form>
      <MediaBrowserModal
        isOpen={mediaModalOpen.value}
        initialType="IMMAGINI"
        onClose$={$(() => {
          mediaModalOpen.value = false;
        })}
        onSelect$={selectMedia}
      />
    </>
  );
});
