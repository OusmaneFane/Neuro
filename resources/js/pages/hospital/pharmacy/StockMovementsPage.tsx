import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { pageItems } from '@/lib/unwrap';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';

interface StockMovement {
  id: number;
  type: string;
  quantity: number;
  reason?: string;
  created_at: string;
  lot?: { product?: { code: string; name: string }; lot_number: string };
  creator?: { full_name: string };
}

const typeLabels: Record<string, string> = {
  IN_PURCHASE: 'Entrée achat',
  IN_RETURN: 'Retour',
  OUT_DISPENSE: 'Dispensation',
  OUT_WASTE: 'Perte / rebut',
  ADJUST: 'Ajustement',
  INVENTORY: 'Inventaire',
};

const typeOptions = [
  { value: '', label: 'Tous les types' },
  ...Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
];

export default defineComponent({
  name: 'StockMovementsPage',
  setup() {
    const type = ref('');
    const page = ref(1);

    const { data, isLoading } = useQuery({
      queryKey: ['stock-movements', type, page],
      queryFn: async () => {
        const { data: res } = await api.get('/stock/movements', {
          params: { type: type.value || undefined, page: page.value, limit: 40 },
        });
        return pageItems<StockMovement>(res);
      },
    });

    return () => (
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Mouvements de stock</h1>
          <p class="mt-1 text-slate-600">Historique des entrées, sorties et ajustements</p>
        </div>

        <SearchableSelect
          modelValue={type.value}
          onUpdate:modelValue={(v: string) => { type.value = v; page.value = 1; }}
          options={typeOptions}
          placeholder="Type de mouvement"
          class="max-w-xs"
        />

        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16"><Spinner /></div>
          ) : !data.value?.data.length ? (
            <div class="p-12"><EmptyState title="Aucun mouvement" /></div>
          ) : (
            <table class="w-full min-w-[640px]">
              <thead>
                <tr class="border-b bg-cyan-50/50 text-left text-sm text-slate-600">
                  <th class="px-4 py-3">Date</th>
                  <th class="px-4 py-3">Type</th>
                  <th class="px-4 py-3">Produit / Lot</th>
                  <th class="px-4 py-3">Qté</th>
                  <th class="px-4 py-3">Motif</th>
                  <th class="px-4 py-3">Par</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                {data.value.data.map((m) => (
                  <tr key={m.id}>
                    <td class="px-4 py-3 text-sm">{m.created_at?.slice(0, 16)}</td>
                    <td class="px-4 py-3">
                      <Badge variant="default">{typeLabels[m.type] ?? m.type}</Badge>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      {m.lot?.product && (
                        <span>{m.lot.product.code} — {m.lot.product.name}</span>
                      )}
                      <span class="ml-1 font-mono text-xs text-slate-500">{m.lot?.lot_number}</span>
                    </td>
                    <td class="px-4 py-3 font-medium">{m.quantity}</td>
                    <td class="px-4 py-3 text-sm text-slate-500">{m.reason ?? '—'}</td>
                    <td class="px-4 py-3 text-sm">{m.creator?.full_name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    );
  },
});
