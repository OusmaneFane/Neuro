import { defineComponent } from 'vue';
import { cn } from '@/lib/utils';

export default defineComponent({
  name: 'Input',
  props: {
    modelValue: [String, Number],
    error: String,
    label: String,
    class: String,
    type: { type: String, default: 'text' },
    placeholder: String,
    autocomplete: String,
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () => (
      <div class={props.class}>
        {props.label ? (
          <label class="mb-1 block text-sm font-medium text-slate-700">{props.label}</label>
        ) : null}
        <input
          {...attrs}
          type={props.type}
          value={props.modelValue}
          placeholder={props.placeholder}
          autocomplete={props.autocomplete}
          onInput={(e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)}
          class={cn(
            'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            props.error && 'border-red-500'
          )}
        />
        {props.error ? <p class="mt-1 text-sm text-red-600">{props.error}</p> : null}
      </div>
    );
  },
});
