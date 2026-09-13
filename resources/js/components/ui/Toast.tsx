import { defineComponent, Teleport } from 'vue';
import { useToastStore } from '@/stores/toast';

export default defineComponent({
  name: 'Toast',
  setup() {
    const store = useToastStore();
    return () => (
      <Teleport to="body">
        <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {store.toasts.map((t) => (
            <div
              key={t.id}
              class={[
                'rounded-lg px-4 py-3 shadow-lg',
                t.type === 'success' && 'bg-emerald-600 text-white',
                t.type === 'error' && 'bg-red-600 text-white',
                t.type === 'info' && 'bg-slate-800 text-white',
              ]}
            >
              {t.message}
            </div>
          ))}
        </div>
      </Teleport>
    );
  },
});
