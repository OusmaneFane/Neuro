import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { pageItems, unwrap } from '@/lib/unwrap';
import { useToastStore } from '@/stores/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';

interface InventoryCount {
  id: number;
  number: string;
  status: string;
  started_at: string;
  validated_at?: string;
  creator?: { full_name: string };
  lines?: { id: number; system_qty: number; counted_qty?: number; variance?: number; lot?: { lot_number: string; product?: { code: string; name: string } } }[];
}

const statusLabels: Record<string, string> = {
  IN_PROGRESS: 'En cours',
  VALIDATED: 'Validé',
  CANCELLED: 'Annulé',
};

export default defineComponent({
  name: 'InventoryCountPage',
  setup() {
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const selectedId = ref<number | null>(null);
    const countedQty = ref<Record<number, string>>({});

    const { data: counts, isLoading } = useQuery({
      queryKey: ['inventory-counts'],
      queryFn: async () => {
        const { data: res } = await api.get('/inventory-counts', { params: { limit: 20 } });
        return pageItems<InventoryCount>(res).data;
      },
    });

    const { data: detail, isLoading: loadingDetail } = useQuery({
      queryKey: ['inventory-count', selectedId],
      queryFn: async () => {
        const { data } = await api.get(`/inventory-counts/${selectedId.value}`);
        return unwrap<InventoryCount>(data);
      },
      enabled: () => selectedId.value != null,
    });

    const createCount = useMutation({
      mutationFn: () => api.post('/inventory-counts', {}),
      onSuccess: (res) => {
        const inv = unwrap<InventoryCount>(res.data);
        toast.add('Inventaire démarré', 'success');
        selectedId.value = inv.id;
        queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
      },
      onError: () => toast.add('Impossible de démarrer', 'error'),
    });

    const saveLines = useMutation({
      mutationFn: () => {
        const lines = Object.entries(countedQty.value)
          .filter(([, v]) => v !== '')
          .map(([id, v]) => ({ id: Number(id), counted_qty: Number(v) }));
        return api.patch(`/inventory-counts/${selectedId.value}/lines`, { lines });
      },
      onSuccess: () => { toast.add('Comptages enregistrés', 'success'); queryClient.invalidateQueries({ queryKey: ['inventory-count', selectedId] }); },
      onError: () => toast.add('Erreur enregistrement', 'error'),
    });

    const validateCount = useMutation({
      mutationFn: () => api.post(`/inventory-counts/${selectedId.value}/validate`),
      onSuccess: () => {
        toast.add('Inventaire validé', 'success');
        queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
        queryClient.invalidateQueries({ queryKey: ['inventory-count', selectedId] });
      },
      onError: () => toast.add('Validation impossible', 'error'),
    });

    return () => (
      <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Inventaires</h1>
            <p class="mt-1 text-slate-600">Comptage physique et ajustements de stock</p>
          </div>
          <Button class="bg-cyan-600" loading={createCount.isPending.value} onClick={() => createCount.mutate()}>
            Nouvel inventaire
          </Button>
        </div>

        <div class="grid gap-6 lg:grid-cols-3">
          <Card class="overflow-hidden p-0 lg:col-span-1">
            <div class="border-b bg-cyan-50/50 px-4 py-3 font-semibold text-cyan-900">Sessions</div>
            {isLoading.value ? (
              <div class="flex justify-center py-8"><Spinner /></div>
            ) : !counts.value?.length ? (
              <div class="p-6"><EmptyState title="Aucun inventaire" /></div>
            ) : (
              <ul class="divide-y">
                {counts.value.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => { selectedId.value = c.id; countedQty.value = {}; }}
                      class={[
                        'w-full px-4 py-3 text-left transition hover:bg-cyan-50/50',
                        selectedId.value === c.id ? 'bg-cyan-50' : '',
                      ]}
                    >
                      <div class="font-mono text-sm font-semibold text-cyan-800">{c.number}</div>
                      <div class="mt-1 flex items-center gap-2">
                        <Badge variant={c.status === 'VALIDATED' ? 'success' : 'warning'}>{statusLabels[c.status] ?? c.status}</Badge>
                        <span class="text-xs text-slate-500">{c.started_at?.slice(0, 10)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card class="overflow-hidden p-0 lg:col-span-2">
            {!selectedId.value ? (
              <div class="p-12"><EmptyState title="Sélectionnez un inventaire" description="Ou démarrez une nouvelle session." /></div>
            ) : loadingDetail.value ? (
              <div class="flex justify-center py-16"><Spinner /></div>
            ) : detail.value ? (
              <>
                <div class="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50/80 px-6 py-3">
                  <div>
                    <span class="font-semibold">{detail.value.number}</span>
                    <Badge variant="default" class="ml-2">{statusLabels[detail.value.status] ?? detail.value.status}</Badge>
                  </div>
                  {detail.value.status === 'IN_PROGRESS' && (
                    <div class="flex gap-2">
                      <Button size="sm" variant="outline" loading={saveLines.isPending.value} onClick={() => saveLines.mutate()}>Enregistrer</Button>
                      <Button size="sm" class="bg-cyan-600" loading={validateCount.isPending.value} onClick={() => validateCount.mutate()}>Valider</Button>
                    </div>
                  )}
                </div>
                <div class="max-h-[480px] overflow-y-auto">
                  <table class="w-full text-sm">
                    <thead class="sticky top-0 bg-white">
                      <tr class="border-b text-left text-slate-500">
                        <th class="px-4 py-2">Produit / Lot</th>
                        <th class="px-4 py-2">Système</th>
                        <th class="px-4 py-2">Compté</th>
                        <th class="px-4 py-2">Écart</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y">
                      {(detail.value.lines ?? []).map((line) => (
                        <tr key={line.id}>
                          <td class="px-4 py-2">
                            <span class="font-mono text-cyan-700">{line.lot?.product?.code}</span>
                            <span class="ml-1">{line.lot?.product?.name}</span>
                            <span class="ml-1 text-xs text-slate-400">({line.lot?.lot_number})</span>
                          </td>
                          <td class="px-4 py-2">{line.system_qty}</td>
                          <td class="px-4 py-2">
                            {detail.value!.status === 'IN_PROGRESS' ? (
                              <Input
                                type="number"
                                class="w-24"
                                v-model={countedQty.value[line.id]}
                                placeholder={String(line.system_qty)}
                                step={0.01}
                              />
                            ) : (
                              line.counted_qty ?? '—'
                            )}
                          </td>
                          <td class="px-4 py-2 font-medium">{line.variance != null ? line.variance : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </Card>
        </div>
      </div>
    );
  },
});
