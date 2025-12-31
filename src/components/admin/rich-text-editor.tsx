import { component$, useVisibleTask$, useSignal, $, useStylesScoped$ } from '@builder.io/qwik';
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
    useStylesScoped$(`
        @import 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        
        .editor-container {
            background: #fff;
            border-radius: 1rem;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .ql-toolbar.ql-snow {
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
            border-color: #e5e7eb !important;
            background: #f9fafb;
            padding: 0.75rem !important;
        }
        
        .ql-container.ql-snow {
            border-bottom-left-radius: 1rem;
            border-bottom-right-radius: 1rem;
            border-color: #e5e7eb !important;
            min-height: 20rem;
            font-size: 1rem;
        }

        .dark .ql-toolbar.ql-snow {
            background: #1f2937;
            border-color: #374151 !important;
        }
        
        .dark .ql-container.ql-snow {
            background: #111827;
            border-color: #374151 !important;
            color: #f3f4f6;
        }

        .dark .ql-stroke { stroke: #9ca3af !important; }
        .dark .ql-fill { fill: #9ca3af !important; }
        .dark .ql-picker { color: #9ca3af !important; }
    `);

    const editorRef = useSignal<Element>();
    const textAreaRef = useSignal<HTMLTextAreaElement>();
    const isInitialized = useSignal(false);
    const htmlContent = useSignal(value || '');

    useStylesScoped$(`
        @import 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        
        .editor-container {
            background: #fff;
            border-radius: 2rem;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 1px solid #f3f4f6;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        
        .ql-toolbar.ql-snow {
            border-top-left-radius: 2rem;
            border-top-right-radius: 2rem;
            border-color: transparent !important;
            background: #ffffff;
            padding: 1rem !important;
            border-bottom: 1px solid #f3f4f6 !important;
        }
        
        .ql-container.ql-snow {
            border-bottom-left-radius: 2rem;
            border-bottom-right-radius: 2rem;
            border-color: transparent !important;
            min-height: 25rem;
            font-size: 1.125rem;
            line-height: 1.75;
        }

        /* Direct integration of frontend 'prose' styles into the editor */
        .ql-editor {
            padding: 2rem !important;
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
            color: #4b5563;
            font-weight: 500;
        }

        .ql-editor img {
            border-radius: 1.5rem !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            margin: 2rem 0 !important;
        }

        .dark .editor-container {
            background: #111827;
            border-color: #1f2937;
        }

        .dark .ql-toolbar.ql-snow {
            background: #111827;
            border-bottom-color: #1f2937 !important;
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

        .dark .ql-stroke { stroke: #6b7280 !important; }
        .dark .ql-fill { fill: #6b7280 !important; }
        .dark .ql-picker { color: #6b7280 !important; }
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

        const imageHandler = $(() => {
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
        });

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

        if (value) {
            quill.root.innerHTML = value;
            if (textAreaRef.value) textAreaRef.value.value = value;
        }

        const handleUpdate = () => {
            const html = quill.root.innerHTML;
            htmlContent.value = html === '<p><br></p>' ? '' : html;
            if (textAreaRef.value) {
                textAreaRef.value.value = htmlContent.value;
            }
        };

        quill.on('text-change', handleUpdate);
        isInitialized.value = true;

        cleanup(() => {
            // Cleanup logic if needed
        });
    });

    return (
        <div class="space-y-4">
            <div class="flex items-center justify-between px-1">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contenuto dell'articolo</label>
                {isUploading.value && (
                    <span class="text-[10px] font-black text-red-600 animate-pulse uppercase tracking-widest">Caricamento immagine...</span>
                )}
            </div>

            <div class="editor-container">
                <div ref={editorRef} />
            </div>

            <textarea
                ref={textAreaRef}
                name={name}
                id={id}
                class="hidden"
            />
        </div>
    );
});
