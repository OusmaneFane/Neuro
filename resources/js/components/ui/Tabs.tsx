import { defineComponent, type PropType } from 'vue';
import { cn } from '@/lib/utils';

export default defineComponent({
  name: 'Tabs',
  props: {
    modelValue: String,
    tabs: { type: Array as PropType<{ value: string; label: string }[]>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => (
      <div class="border-b border-slate-200">
        <nav class="-mb-px flex gap-8">
          {props.tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => emit('update:modelValue', tab.value)}
              class={cn(
                'border-b-2 py-4 text-sm font-medium transition-colors',
                props.modelValue === tab.value
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    );
  },
});
