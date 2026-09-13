import { defineComponent } from 'vue';
import { cn } from '@/lib/utils';

const variants: Record<string, string> = {
  default: 'bg-slate-100 text-slate-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  destructive: 'bg-red-100 text-red-800',
  destructive: 'bg-red-100 text-red-800',
};

export default defineComponent({
  name: 'Badge',
  props: { variant: { type: String, default: 'default' }, class: String },
  setup(props, { slots }) {
    return () => (
      <span
        class={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variants[props.variant] ?? variants.default,
          props.class
        )}
      >
        {slots.default?.()}
      </span>
    );
  },
});
