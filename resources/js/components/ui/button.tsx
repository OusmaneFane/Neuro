import { defineComponent, type PropType } from 'vue';
import { cn } from '@/lib/utils';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  class?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
}

const variants = {
  primary: 'bg-primary text-white hover:opacity-90',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 bg-transparent hover:bg-slate-50',
  ghost: 'hover:bg-slate-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export default defineComponent({
  name: 'Button',
  props: {
    variant: { type: String as PropType<Props['variant']>, default: 'primary' },
    size: { type: String as PropType<Props['size']>, default: 'md' },
    loading: Boolean,
    type: { type: String as PropType<Props['type']>, default: 'button' },
    disabled: Boolean,
    onClick: { type: Function as PropType<Props['onClick']> },
  },
  setup(props, { slots, attrs }) {
    return () => (
      <button
        {...attrs}
        onClick={props.onClick}
        type={props.type}
        disabled={props.disabled || props.loading}
        class={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
          variants[props.variant ?? 'primary'],
          sizes[props.size ?? 'md'],
          attrs.class as string
        )}
      >
        {props.loading ? (
          <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {slots.default?.()}
      </button>
    );
  },
});
