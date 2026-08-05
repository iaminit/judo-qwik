import {
  component$,
  useSignal,
  $,
  useVisibleTask$,
  useComputed$,
} from "@builder.io/qwik";
import { type QRL } from "@builder.io/qwik";

interface MediaFile {
  name?: string;
  path?: string;
  url?: string;
  extension?: string;
  tag?: string;
}

const getFileType = (file: MediaFile) => {
  const fileName = (file.name || file.path || file.url || "").toLowerCase();
  const ext = fileName.split(".").pop() || "";
  const tag = (file.tag || "").toUpperCase();

  if (
    ["pdf", "doc", "docx"].includes(ext) ||
    tag === "DOCUMENTI" ||
    tag === "PDF"
  ) {
    return "PDF";
  }
  if (["mp4", "webm", "mov", "avi"].includes(ext) || tag === "VIDEO") {
    return "VIDEO";
  }
  if (["mp3", "wav", "m4a", "ogg"].includes(ext) || tag === "AUDIO") {
    return "AUDIO";
  }
  if (
    ["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(ext) ||
    tag === "IMMAGINI"
  ) {
    return "IMMAGINI";
  }
  return "IMMAGINI";
};

interface MediaBrowserModalProps {
  isOpen: boolean;
  initialType?: "TUTTI" | "IMMAGINI" | "VIDEO" | "AUDIO" | "PDF";
  onClose?: QRL<() => void>;
  onClose$?: QRL<() => void>;
  onSelect?: QRL<(url: string) => void>;
  onSelect$?: QRL<(url: string) => void>;
}

export const MediaBrowserModal = component$<MediaBrowserModalProps>((props) => {
  const { isOpen } = props;
  const closeFn = props.onClose$ || props.onClose;
  const selectFn = props.onSelect$ || props.onSelect;

  const files = useSignal<MediaFile[]>([]);
  const isLoading = useSignal(true);
  const searchTerm = useSignal("");
  const selectedType = useSignal<string>(props.initialType || "TUTTI");

  const fetchFiles = $(async () => {
    isLoading.value = true;
    try {
      let res = await fetch("/api/local-media");
      if (!res.ok) {
        res = await fetch("/api/media");
      }
      if (res.ok) {
        const data = await res.json();
        files.value = data;
      }
    } catch (err) {
      console.error("Error fetching media files:", err);
    } finally {
      isLoading.value = false;
    }
  });

  useVisibleTask$(({ track }) => {
    track(() => isOpen);
    if (isOpen) {
      fetchFiles();
    }
  });

  const typeCounts = useComputed$(() => {
    const counts = {
      TUTTI: files.value.length,
      IMMAGINI: 0,
      VIDEO: 0,
      AUDIO: 0,
      PDF: 0,
    };
    for (const file of files.value) {
      const type = getFileType(file);
      if (type in counts) {
        (counts as any)[type]++;
      }
    }
    return counts;
  });

  const filteredFiles = useComputed$(() => {
    const query = searchTerm.value.toLowerCase().trim();
    const activeType = selectedType.value;

    return files.value.filter((f) => {
      const fileName = (f.name || f.path || f.url || "").toLowerCase();
      const fileType = getFileType(f);

      // 1. Text filter
      if (query && !fileName.includes(query)) {
        return false;
      }

      // 2. Type filter
      if (activeType !== "TUTTI" && fileType !== activeType) {
        return false;
      }

      return true;
    });
  });

  if (!isOpen) return null;

  const filterTabs = [
    { id: "TUTTI", label: "Tutti", icon: "📁", count: typeCounts.value.TUTTI },
    {
      id: "IMMAGINI",
      label: "Immagini",
      icon: "🖼️",
      count: typeCounts.value.IMMAGINI,
    },
    { id: "VIDEO", label: "Video", icon: "🎥", count: typeCounts.value.VIDEO },
    {
      id: "AUDIO",
      label: "Audio / MP3",
      icon: "🔊",
      count: typeCounts.value.AUDIO,
    },
    { id: "PDF", label: "PDF / Doc", icon: "📄", count: typeCounts.value.PDF },
  ];

  return (
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div
        class="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick$={closeFn}
      />

      <div class="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in duration-300">
        {/* Header */}
        <div class="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
          <div>
            <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              Sfoglia Libreria Media
            </h2>
            <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
              Filtra per tipo e seleziona un file
            </p>
          </div>
          <button
            onClick$={closeFn}
            class="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-all font-bold"
          >
            ✕
          </button>
        </div>

        {/* Search & Type Filter Tabs */}
        <div class="p-4 md:p-6 border-b border-gray-100 dark:border-white/5 space-y-4">
          <input
            type="text"
            placeholder="Cerca file per nome (es. hane, seoi, kata, pdf)..."
            bind:value={searchTerm}
            class="w-full px-6 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-red-500/50 outline-none transition-all dark:text-white font-bold"
          />

          {/* Filter Tabs */}
          <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {filterTabs.map((tab) => {
              const isActive = selectedType.value === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick$={() => (selectedType.value = tab.id)}
                  class={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    class={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-500"}`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {isLoading.value ? (
            <div class="h-64 flex items-center justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div>
            </div>
          ) : filteredFiles.value.length === 0 ? (
            <div class="text-center py-20 grayscale opacity-40">
              <div class="text-6xl mb-4">📂</div>
              <p class="font-black uppercase tracking-widest text-gray-400">
                Nessun file{" "}
                {selectedType.value !== "TUTTI"
                  ? selectedType.value.toLowerCase()
                  : ""}{" "}
                trovato {searchTerm.value ? `per "${searchTerm.value}"` : ""}
              </p>
            </div>
          ) : (
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles.value.map((file, index) => {
                const displayName = file.path || file.name || "";
                const fileType = getFileType(file);
                const fileKey = [
                  file.url || "",
                  file.path || "",
                  file.name || "",
                  file.tag || "",
                  index,
                ].join("|");

                return (
                  <div
                    key={fileKey}
                    class="group relative aspect-square bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-red-500/30 transition-all border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center"
                    onClick$={() => selectFn && selectFn(displayName)}
                  >
                    {fileType === "VIDEO" ? (
                      <div class="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-4">
                        <div class="text-4xl mb-1">🎥</div>
                        <span class="text-[9px] font-black uppercase text-red-400">
                          Video
                        </span>
                      </div>
                    ) : fileType === "AUDIO" ? (
                      <div class="w-full h-full flex flex-col items-center justify-center bg-red-950/20 text-red-500 p-4">
                        <div class="text-4xl mb-1">🔊</div>
                        <span class="text-[9px] font-black uppercase text-red-500">
                          Audio
                        </span>
                      </div>
                    ) : fileType === "PDF" ? (
                      <div class="w-full h-full flex flex-col items-center justify-center bg-amber-500/10 text-amber-600 p-4">
                        <div class="text-4xl mb-1">📄</div>
                        <span class="text-[9px] font-black uppercase text-amber-600">
                          Documento PDF
                        </span>
                      </div>
                    ) : (
                      <img
                        src={file.url || `/media/${displayName}`}
                        alt={displayName}
                        class="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    )}
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-center">
                      <span class="text-[7px] font-black text-red-500 uppercase tracking-widest mb-1">
                        {fileType}
                      </span>
                      <p class="text-[9px] font-black text-white truncate uppercase tracking-widest">
                        {displayName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div class="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
          {filteredFiles.value.length} file visualizzati (di{" "}
          {files.value.length} totali)
        </div>
      </div>
    </div>
  );
});
