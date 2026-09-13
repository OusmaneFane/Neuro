import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EmptyState',
  props: {
    title: { type: String, default: 'Aucune donnée' },
    description: String,
  },
  setup(props, { slots }) {
    return () => (
      <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center">
        <p class="text-sm font-medium text-slate-600">{props.title}</p>
        {props.description ? <p class="mt-1 text-sm text-slate-500">{props.description}</p> : null}
        {slots.default?.()}
      </div>
    );
  },
});
