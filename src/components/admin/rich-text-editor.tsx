import { component$, useVisibleTask$, useSignal, $, useStylesScoped$ } from '@builder.io/qwik';
import Quill from 'quill';

interface RichTextEditorProps {
    value?: string;
    id: string;
    name: string;
    placeholder?: string;
}

export default component$<RichTextEditorProps>(({ value, id, name, placeholder }) => {
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

    useVisibleTask$(({ cleanup }) => {
        if (!editorRef.value || isInitialized.value) return;

        // Force Quill to use inline styles instead of classes for colors/backgrounds
        // This is compatible with both 1.x and 2.x
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

        const quill = new Quill(editorRef.value as HTMLElement, {
            theme: 'snow',
            placeholder: placeholder || 'Inizia a scrivere...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['blockquote', 'code-block'],
                    ['clean']
                ]
            }
        });

        if (value) {
            quill.root.innerHTML = value;
            if (textAreaRef.value) textAreaRef.value.value = value;
        }

        const handleUpdate = () => {
            if (textAreaRef.value) {
                const html = quill.root.innerHTML;
                console.log('[RichText] Current HTML:', html);
                textAreaRef.value.value = html === '<p><br></p>' ? '' : html;
            }
        };

        quill.on('text-change', handleUpdate);
        isInitialized.value = true;

        cleanup(() => {
            // Cleanup logic if needed
        });
    });

    return (
        <div class="space-y-2">
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
