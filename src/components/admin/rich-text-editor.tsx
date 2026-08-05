import { component$, useVisibleTask$, useSignal, $, useStyles$, noSerialize } from '@builder.io/qwik';
import Quill from 'quill';

interface RichTextEditorProps {
    value?: string;
    id: string;
    name: string;
    placeholder?: string;
    mediaFolder?: string; // e.g., 'post', 'techniques'
}

export default component$<RichTextEditorProps>(({ value, id, name, placeholder, mediaFolder = '' }) => {
    const isUploading = useSignal(false);
    const isCodeView = useSignal(false);
    const editorRef = useSignal<Element>();
    const textAreaRef = useSignal<HTMLTextAreaElement>();
    const isInitialized = useSignal(false);
    const htmlContent = useSignal(value || '');
    const quillInstance = useSignal<Quill>();

    // Quill creates its toolbar and editor nodes at runtime, so these selectors
    // must remain global instead of receiving Qwik's scoped CSS attribute.
    useStyles$(`
        @import 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        
        .editor-container {
            background: #fff;
            border-radius: 1.5rem;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        
        .ql-toolbar.ql-snow {
            border-top-left-radius: 1.5rem;
            border-top-right-radius: 1.5rem;
            border-color: transparent !important;
            background: #f9fafb;
            padding: 0.75rem 1rem !important;
            border-bottom: 1px solid #e5e7eb !important;
        }
        
        .ql-container.ql-snow {
            border-bottom-left-radius: 1.5rem;
            border-bottom-right-radius: 1.5rem;
            border-color: transparent !important;
            min-height: 22rem;
            font-size: 1.05rem;
            line-height: 1.7;
        }

        .ql-editor {
            padding: 1.5rem !important;
            font-family: inherit;
        }

        .ql-editor h1, .ql-editor h2, .ql-editor h3 {
            font-weight: 900 !important;
            letter-spacing: -0.025em !important;
            margin-top: 1.5em !important;
            margin-bottom: 0.5em !important;
            color: #111827;
        }

        .ql-editor p {
            margin-bottom: 1.25em !important;
            color: #374151;
            font-weight: 500;
        }

        .ql-editor img {
            border-radius: 1rem !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            margin: 1.5rem 0 !important;
            max-width: 100%;
        }

        .dark .editor-container {
            background: #111827;
            border-color: #1f2937;
        }

        .dark .ql-toolbar.ql-snow {
            background: #1f2937;
            border-bottom-color: #374151 !important;
        }
        
        .dark .ql-container.ql-snow {
            background: #111827;
            color: #f3f4f6;
        }

        .dark .ql-editor h1, .dark .ql-editor h2, .dark .ql-editor h3 {
            color: #ffffff;
        }

        .dark .ql-editor p {
            color: #9ca3af;
        }

        .dark .ql-stroke { stroke: #9ca3af !important; }
        .dark .ql-fill { fill: #9ca3af !important; }
        .dark .ql-picker { color: #9ca3af !important; }
    `);

    useVisibleTask$(({ cleanup }) => {
        if (!editorRef.value || isInitialized.value) return;

        // Force Quill to use inline styles instead of classes for colors/backgrounds
        try {
            const DirectionAttribute = Quill.import('attributors/style/direction') as any;
            const AlignStyle = Quill.import('attributors/style/align') as any;
            const ColorStyle = Quill.import('attributors/style/color') as any;
            const BackgroundStyle = Quill.import('attributors/style/background') as any;
            const SizeStyle = Quill.import('attributors/style/size') as any;

            Quill.register(DirectionAttribute, true);
            Quill.register(AlignStyle, true);
            Quill.register(ColorStyle, true);
            Quill.register(BackgroundStyle, true);
            Quill.register(SizeStyle, true);
        } catch (e) {
            console.warn('[RichText] Error registering styles:', e);
        }

        const imageHandler = () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', mediaFolder);

                isUploading.value = true;
                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const range = quill.getSelection();
                        quill.insertEmbed(range?.index || 0, 'image', data.url);
                    } else {
                        alert('Errore durante l\'upload dell\'immagine');
                    }
                } catch (e) {
                    console.error('Upload error:', e);
                    alert('Errore di connessione durante l\'upload');
                } finally {
                    isUploading.value = false;
                }
            };
        };

        const quill = new Quill(editorRef.value as HTMLElement, {
            theme: 'snow',
            placeholder: placeholder || 'Inizia a scrivere...',
            modules: {
                toolbar: {
                    container: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['blockquote', 'code-block'],
                        ['clean']
                    ],
                    handlers: {
                        image: () => imageHandler()
                    }
                }
            }
        });

        quillInstance.value = noSerialize(quill);

        if (htmlContent.value) {
            quill.root.innerHTML = htmlContent.value;
        }

        const handleUpdate = () => {
            if (!isCodeView.value) {
                const html = quill.root.innerHTML;
                htmlContent.value = html === '<p><br></p>' ? '' : html;
            }
        };

        quill.on('text-change', handleUpdate);
        isInitialized.value = true;

        cleanup(() => {
            quill.off('text-change', handleUpdate);
        });
    });

    const toggleCodeView = $(() => {
        if (isCodeView.value) {
            // Switching from Code -> Visual
            if (quillInstance.value) {
                quillInstance.value.root.innerHTML = htmlContent.value;
            }
            isCodeView.value = false;
        } else {
            // Switching from Visual -> Code
            if (quillInstance.value) {
                const html = quillInstance.value.root.innerHTML;
                htmlContent.value = html === '<p><br></p>' ? '' : html;
            }
            isCodeView.value = true;
        }
    });

    return (
        <div class="space-y-3">
            {/* Header controls: Mode Switcher & Status */}
            <div class="flex items-center justify-between px-1">
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        onClick$={toggleCodeView}
                        class={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm border ${
                            isCodeView.value
                                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {isCodeView.value ? (
                            <>
                                <span>💻</span> Modalità: Codice HTML (Nessuna Sanificazione)
                            </>
                        ) : (
                            <>
                                <span>👁️</span> Modalità: Visuale WYSIWYG
                            </>
                        )}
                    </button>
                    <span class="text-[10px] text-gray-400 font-medium hidden sm:inline">
                        (Clicca per passare a {isCodeView.value ? 'Visuale' : 'Codice Sorgente HTML'})
                    </span>
                </div>

                {isUploading.value && (
                    <span class="text-[10px] font-black text-red-600 animate-pulse uppercase tracking-widest">Caricamento immagine...</span>
                )}
            </div>

            {/* Visual Editor (Quill) Container */}
            <div class={`editor-container ${isCodeView.value ? 'hidden' : 'block'}`}>
                <div ref={editorRef} />
            </div>

            {/* HTML Code View Editor */}
            <div class={isCodeView.value ? 'block' : 'hidden'}>
                <textarea
                    value={htmlContent.value}
                    onInput$={(e) => {
                        htmlContent.value = (e.target as HTMLTextAreaElement).value;
                    }}
                    placeholder="Incolla o scrivi codice HTML grezzo qui..."
                    class="w-full h-80 p-4 font-mono text-xs leading-relaxed bg-gray-900 text-amber-300 rounded-2xl border border-gray-800 outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                    spellcheck={false}
                />
                <p class="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                    💡 In questa modalità tutto il codice HTML (tag custom, audio, video, iframe, stili inline) viene preservato al 100% senza alcuna alterazione o pulizia.
                </p>
            </div>

            {/* Hidden Input for Form Submission */}
            <textarea
                ref={textAreaRef}
                name={name}
                id={id}
                value={htmlContent.value}
                class="hidden"
            />
        </div>
    );
});
