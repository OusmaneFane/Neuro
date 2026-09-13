import { defineComponent } from 'vue';
import { cn } from '@/lib/utils';

export default defineComponent({
  name: 'Card',
  setup(_, { slots, attrs }) {
    return () => (
      <div
        {...attrs}
        class={cn(
          'rounded-xl border border-slate-200 bg-white p-6 shadow-sm',
          attrs.class as string
        )}
      >
        {slots.default?.()}
      </div>
    );
  },
});
