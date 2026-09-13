import { defineComponent, Teleport, h } from 'vue';
import { cn } from '@/lib/utils';

export default defineComponent({
  name: 'Modal',
  props: {
    modelValue: Boolean,
    title: String,
    class: String,
  },
  emits: ['update:modelValue'],
  setup(props, { slots, emit }) {
    return () =>
      props.modelValue
        ? h(
            Teleport,
            { to: 'body' },
            h('div', {
              class: 'fixed inset-0 z-50 flex items-center justify-center',
              onClick: () => emit('update:modelValue', false),
            }, [
              h('div', { class: 'fixed inset-0 bg-black/50', 'aria-hidden': 'true' }),
              h(
                'div',
                {
                  class: cn(
                    'relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl',
                    props.class
                  ),
                  onClick: (e: MouseEvent) => e.stopPropagation(),
                },
                [
                  props.title ? h('h2', { class: 'mb-4 text-lg font-semibold' }, props.title) : null,
                  slots.default?.(),
                ]
              ),
            ])
          )
        : null;
  },
});
