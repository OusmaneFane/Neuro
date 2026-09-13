import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { pageItems, unwrap } from '@/lib/unwrap';
import { useToastStore } from '@/stores/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref, computed } from 'vue';

interface StockLot {
  id: number;
  lot_number: string;
  qty_on_hand: number;
  unit_cost: number;
  expiry_date?: string;
  location?: string;
  product?: { id: number; code: string; name: string; unit: string };
}

interface Product {
  id: number;
  code: string;
  name: string;
}

export default defineComponent({
  name: 'StockLotsPage',
  setup() {
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const adjustLotId = ref('');
    const adjustQty = ref('');
    const adjustReason = ref('');
    const manualForm = ref({
      product_id: '', lot_number: '', quantity: '', unit_cost: '', expiry_date: '', location: '',
    });

    const { data, isLoading } = useQuery({
      queryKey: ['stock-lots'],
      queryFn: async () => {
        const { data: res } = await api.get('/stock/lots', { params: { limit: 100 } });
        const body = unwrap<{ data: StockLot[]; meta?: { stock_valuation: number } }>(res);
        return {
          lots: body.data ?? (Array.isArray(body) ? body : []),
          valuation: (body as { meta?: { stock_valuation: number } }).meta?.stock_valuation ?? 0,
        };
      },
    });

    const { data: products } = useQuery({
      queryKey: ['products-select'],
      queryFn: async () => {
        const { data: res } = await api.get('/products', { params: { active_only: true, limit: 200 } });
        return pageItems<Product>(res).data;
      },
    });

    const productOptions = computed(() =>
      (products.value ?? []).map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` }))
    );

    const manualIn = useMutation({
      mutationFn: () => api.post('/stock/lots/in', {
        product_id: Number(manualForm.value.product_id),
        lot_number: manualForm.value.lot_number,
        quantity: Number(manualForm.value.quantity),
        unit_cost: Number(manualForm.value.unit_cost) || 0,
        expiry_date: manualForm.value.expiry_date || undefined,
        location: manualForm.value.location || undefined,
      }),
      onSuccess: () => {
        toast.add('Entrée en stock enregistrée', 'success');
        manualForm.value = { product_id: '', lot_number: '', quantity: '', unit_cost: '', expiry_date: '', location: '' };
        queryClient.invalidateQueries({ queryKey: ['stock-lots'] });
      },
      onError: () => toast.add('Entrée impossible', 'error'),
    });

    const adjust = useMutation({
      mutationFn: () => api.post(`/stock/lots/${adjustLotId.value}/adjust`, {
        qty_on_hand: Number(adjustQty.value),
        reason: adjustReason.value || undefined,
      }),
      onSuccess: () => {
        toast.add('Ajustement enregistré', 'success');
        adjustLotId.value = '';
        adjustQty.value = '';
        queryClient.invalidateQueries({ queryKey: ['stock-lots'] });
      },
      onError: () => toast.add('Ajustement impossible', 'error'),
    });

    return () => (
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Lots & valorisation</h1>
          <p class="mt-1 text-slate-600">Stock par lot, entrées manuelles et ajustements</p>
        </div>

        {data.value && (
          <Card class="border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50 p-5">
            <p class="text-sm font-medium text-cyan-800">Valorisation totale du stock</p>
            <p class="mt-1 text-3xl font-bold text-cyan-900">{formatMoney(data.value.valuation)}</p>
          </Card>
        )}

        <div class="grid gap-6 lg:grid-cols-2">
          <Card class="border-cyan-100 p-6">
            <h3 class="mb-4 font-semibold text-cyan-900">Entrée manuelle</h3>
            <div class="space-y-3">
              <SearchableSelect
                modelValue={manualForm.value.product_id}
                onUpdate:modelValue={(v: string) => { manualForm.value.product_id = v; }}
                options={productOptions.value}
                placeholder="Produit"
              />
              <Input v-model={manualForm.value.lot_number} placeholder="N° lot" />
              <div class="grid grid-cols-2 gap-2">
                <Input type="number" v-model={manualForm.value.quantity} placeholder="Quantité" step={0.01} />
                <Input type="number" v-model={manualForm.value.unit_cost} placeholder="Coût unitaire F CFA" />
              </div>
              <Input type="date" v-model={manualForm.value.expiry_date} />
              <Input v-model={manualForm.value.location} placeholder="Emplacement" />
              <Button class="w-full bg-cyan-600" loading={manualIn.isPending.value} disabled={!manualForm.value.product_id || !manualForm.value.lot_number} onClick={() => manualIn.mutate()}>
                Enregistrer l'entrée
              </Button>
            </div>
          </Card>

          <Card class="p-6">
            <h3 class="mb-4 font-semibold">Ajustement de lot</h3>
            <div class="space-y-3">
              <Input v-model={adjustLotId.value} placeholder="ID du lot" />
              <Input type="number" v-model={adjustQty.value} placeholder="Nouvelle quantité" step={0.01} />
              <Input v-model={adjustReason.value} placeholder="Motif" />
              <Button variant="outline" loading={adjust.isPending.value} disabled={!adjustLotId.value} onClick={() => adjust.mutate()}>
                Ajuster
              </Button>
            </div>
          </Card>
        </div>

        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16"><Spinner /></div>
          ) : !data.value?.lots.length ? (
            <div class="p-12"><EmptyState title="Aucun lot en stock" /></div>
          ) : (
            <table class="w-full min-w-[720px]">
              <thead>
                <tr class="border-b bg-cyan-50/50 text-left text-sm text-slate-600">
                  <th class="px-4 py-3">Produit</th>
                  <th class="px-4 py-3">Lot</th>
                  <th class="px-4 py-3">Qté</th>
                  <th class="px-4 py-3">Péremption</th>
                  <th class="px-4 py-3">Emplacement</th>
                  <th class="px-4 py-3 text-right">Valeur</th>
                  <th class="px-4 py-3">ID</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                {data.value.lots.map((lot) => (
                  <tr key={lot.id} class="hover:bg-cyan-50/20">
                    <td class="px-4 py-3">
                      <span class="font-mono text-xs text-cyan-700">{lot.product?.code}</span>
                      <div class="text-sm">{lot.product?.name}</div>
                    </td>
                    <td class="px-4 py-3 font-mono text-sm">{lot.lot_number}</td>
                    <td class="px-4 py-3">{lot.qty_on_hand}</td>
                    <td class="px-4 py-3 text-sm">{lot.expiry_date?.slice(0, 10) ?? '—'}</td>
                    <td class="px-4 py-3 text-sm">{lot.location ?? '—'}</td>
                    <td class="px-4 py-3 text-right font-medium">{formatMoney(lot.qty_on_hand * lot.unit_cost)}</td>
                    <td class="px-4 py-3 font-mono text-xs text-slate-400">{lot.id}</td>
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
