import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PatientFormPageHero',
  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
  },
  setup(props, { slots }) {
    return () => (
      <div class="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-linear-to-br from-slate-50 via-white to-primary/5 p-6 shadow-md sm:p-8">
        <div class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex min-w-0 gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/35">
              {slots.icon?.()}
            </div>
            <div class="min-w-0">
              <h2 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{props.title}</h2>
              {props.description ? (
                <p class="mt-1 max-w-2xl text-slate-600">{props.description}</p>
              ) : null}
              {slots.extra?.()}
            </div>
          </div>
          {slots.actions ? (
            <div class="flex shrink-0 flex-wrap items-center gap-3">{slots.actions()}</div>
          ) : null}
        </div>
      </div>
    );
  },
});
