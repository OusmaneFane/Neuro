import { defineComponent, ref, watch, onMounted } from 'vue';

function execCmd(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export default defineComponent({
  name: 'RichTextEditor',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Saisir le texte...' },
    minHeight: { type: String, default: '280px' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const editorRef = ref<HTMLDivElement | null>(null);
    const isInternalUpdate = ref(false);

    function emitContent() {
      if (!editorRef.value || isInternalUpdate.value) return;
      emit('update:modelValue', editorRef.value.innerHTML);
    }

    function handleToolbar(e: MouseEvent, cmd: string, value?: string) {
      e.preventDefault();
      editorRef.value?.focus();
      execCmd(cmd, value);
      emitContent();
    }

    watch(
      () => props.modelValue,
      (html) => {
        if (!editorRef.value) return;
        if (editorRef.value.innerHTML === html) return;
        isInternalUpdate.value = true;
        editorRef.value.innerHTML = html ?? '';
        isInternalUpdate.value = false;
      },
      { immediate: true }
    );

    onMounted(() => {
      if (editorRef.value && (props.modelValue ?? '') !== editorRef.value.innerHTML) {
        editorRef.value.innerHTML = props.modelValue ?? '';
      }
    });

    return () => (
      <div class="rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
        <div class="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 p-1.5">
          <button
            type="button"
            onMousedown={(e: MouseEvent) => handleToolbar(e, 'bold')}
            class="rounded p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            title="Gras"
          >
            <span class="font-bold text-sm">B</span>
          </button>
          <button
            type="button"
            onMousedown={(e: MouseEvent) => handleToolbar(e, 'italic')}
            class="rounded p-2 italic text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            title="Italique"
          >
            <span class="text-sm">I</span>
          </button>
          <button
            type="button"
            onMousedown={(e: MouseEvent) => handleToolbar(e, 'underline')}
            class="rounded p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 underline"
            title="Souligné"
          >
            <span class="text-sm">U</span>
          </button>
          <span class="mx-1 h-5 w-px bg-slate-300" />
          <button
            type="button"
            onMousedown={(e: MouseEvent) => handleToolbar(e, 'insertUnorderedList')}
            class="rounded p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            title="Liste à puces"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            onMousedown={(e: MouseEvent) => handleToolbar(e, 'insertOrderedList')}
            class="rounded p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            title="Liste numérotée"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m5 0h-5M7 16h10" />
            </svg>
          </button>
          <span class="mx-1 h-5 w-px bg-slate-300" />
          <button
            type="button"
            onMousedown={(e: MouseEvent) => handleToolbar(e, 'formatBlock', 'h2')}
            class="rounded px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            title="Titre 2"
          >
            H2
          </button>
          <button
            type="button"
            onMousedown={(e: MouseEvent) => handleToolbar(e, 'formatBlock', 'h3')}
            class="rounded px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            title="Titre 3"
          >
            H3
          </button>
          <button
            type="button"
            onMousedown={(e: MouseEvent) => handleToolbar(e, 'formatBlock', 'p')}
            class="rounded px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            title="Paragraphe"
          >
            P
          </button>
        </div>
        <div
          ref={editorRef}
          contenteditable="true"
          data-placeholder={props.placeholder}
          onInput={emitContent}
          onBlur={emitContent}
          class="min-w-0 resize-y overflow-auto px-4 py-3 text-slate-800 outline-none prose prose-sm max-w-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
          style={{ minHeight: props.minHeight }}
        />
      </div>
    );
  },
});
