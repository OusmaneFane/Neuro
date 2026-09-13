import { defineComponent, ref, computed, watch, onUnmounted, nextTick, Teleport } from 'vue';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

export default defineComponent({
  name: 'SearchableSelect',
  props: {
    modelValue: { type: String, default: '' },
    options: { type: Array as () => SearchableSelectOption[], required: true },
    placeholder: { type: String, default: 'Rechercher ou choisir...' },
    emptyText: { type: String, default: 'Aucun résultat' },
    class: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    /** Hauteur max de la liste d’options (Tailwind). */
    listMaxHeightClass: { type: String, default: 'max-h-80' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const search = ref('');
    const containerRef = ref<HTMLElement | null>(null);
    const panelRef = ref<HTMLElement | null>(null);
    const searchInputRef = ref<HTMLInputElement | null>(null);
    const panelPosition = ref({ top: 0, left: 0, width: 0, listMaxHeightPx: 320 });

    const selectedLabel = computed(() => {
      if (!props.modelValue) return '';
      const opt = props.options.find((o) => o.value === props.modelValue);
      return opt ? opt.label : props.modelValue;
    });

    const filteredOptions = computed(() => {
      const q = search.value.trim().toLowerCase();
      if (!q) return props.options;
      return props.options.filter(
        (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
      );
    });

    function updatePanelPosition() {
      const el = containerRef.value;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const minReadable = 352;
      let width = Math.max(r.width, minReadable);
      width = Math.min(width, window.innerWidth - 16);
      let left = r.left;
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - 8 - width);
      }

      const margin = 8;
      /** Zone recherche + bordures du panneau (px), avant la liste scrollable. */
      const headerBlock = 56;
      const maxListPreferred = 320;
      const spaceBelow = window.innerHeight - r.bottom - margin - 4 - headerBlock;
      const spaceAbove = r.top - margin - 4 - headerBlock;

      let listMaxHeightPx = Math.min(maxListPreferred, Math.max(96, spaceBelow));
      let top = r.bottom + 4;

      if (listMaxHeightPx < 120 && spaceAbove > spaceBelow) {
        listMaxHeightPx = Math.min(maxListPreferred, Math.max(96, spaceAbove));
        const approxPanelH = headerBlock + listMaxHeightPx + 12;
        top = Math.max(margin, r.top - approxPanelH - 4);
      }

      panelPosition.value = { top, left, width, listMaxHeightPx };
    }

    function refinePanelVerticalPosition() {
      const panel = panelRef.value;
      if (!panel || !isOpen.value) return;
      const margin = 8;
      let { top, listMaxHeightPx } = panelPosition.value;
      const ph = panel.getBoundingClientRect().height;

      if (top + ph > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - margin - ph);
      }
      if (top < margin) {
        top = margin;
        const headerBlock = 56;
        listMaxHeightPx = Math.min(
          listMaxHeightPx,
          Math.max(96, window.innerHeight - margin - top - headerBlock - 8)
        );
      }

      panelPosition.value = { ...panelPosition.value, top, listMaxHeightPx };
    }

    function open() {
      if (props.disabled) return;
      search.value = '';
      isOpen.value = true;
    }

    function close() {
      isOpen.value = false;
      search.value = '';
    }

    function select(opt: SearchableSelectOption) {
      emit('update:modelValue', opt.value);
      close();
    }

    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.value?.contains(t)) return;
      if (panelRef.value?.contains(t)) return;
      close();
    }

    watch(isOpen, async (open) => {
      if (open) {
        await nextTick();
        updatePanelPosition();
        requestAnimationFrame(() => {
          refinePanelVerticalPosition();
        });
        searchInputRef.value?.focus();
        setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
        window.addEventListener('scroll', updatePanelPosition, true);
        window.addEventListener('resize', updatePanelPosition);
      } else {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('scroll', updatePanelPosition, true);
        window.removeEventListener('resize', updatePanelPosition);
      }
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', updatePanelPosition, true);
      window.removeEventListener('resize', updatePanelPosition);
    });

    return () => (
      <div ref={containerRef} class={cn('relative', props.class)}>
        <button
          type="button"
          disabled={props.disabled}
          onClick={open}
          class={cn(
            'flex w-full min-h-[2.75rem] items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            props.disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <span
            class={cn(
              'min-w-0 flex-1 pr-2 text-left',
              props.modelValue ? 'text-slate-800' : 'text-slate-500',
              'line-clamp-3 leading-snug'
            )}
          >
            {props.modelValue ? selectedLabel.value : props.placeholder}
          </span>
          <svg
            class={cn('h-4 w-4 shrink-0 text-slate-400 transition', isOpen.value && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <Teleport to="body">
          {isOpen.value ? (
            <div
              ref={panelRef}
              class="fixed z-[6000] flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5"
              style={{
                top: `${panelPosition.value.top}px`,
                left: `${panelPosition.value.left}px`,
                width: `${panelPosition.value.width}px`,
              }}
            >
              <div class="shrink-0 border-b border-slate-100 p-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search.value}
                  onInput={(e) => {
                    search.value = (e.target as HTMLInputElement).value;
                  }}
                  placeholder="Taper pour filtrer..."
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div
                class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1"
                style={{ maxHeight: `${panelPosition.value.listMaxHeightPx}px` }}
              >
                {filteredOptions.value.length === 0 ? (
                  <p class="px-3 py-4 text-center text-sm text-slate-500">{props.emptyText}</p>
                ) : (
                  filteredOptions.value.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => select(opt)}
                      class={cn(
                        'w-full whitespace-normal wrap-break-word rounded-lg px-3 py-2.5 text-left text-sm leading-snug transition',
                        opt.value === props.modelValue
                          ? 'bg-primary/15 font-medium text-primary'
                          : 'text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </Teleport>
      </div>
    );
  },
});
