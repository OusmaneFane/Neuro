import Badge from '@/components/ui/badge';
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

interface PurchaseOrder {
  id: number;
  number: string;
  status: string;
  ordered_at?: string;
  expected_at?: string;
  supplier?: { id: number; name: string };
  lines?: { id: number; product_id: number; quantity_ordered: number; quantity_received: number; unit_cost: number; product?: { name: string; code: string } }[];
}

interface Supplier {
  id: number;
  code: string;
  name: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon', SENT: 'Envoyée', PARTIALLY_RECEIVED: 'Part. reçue',
  RECEIVED: 'Reçue', CANCELLED: 'Annulée',
};

export default defineComponent({
  name: 'PurchaseOrdersPage',
  setup() {
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const showForm = ref(false);
    const receivePoId = ref<number | null>(null);
    const receiveLines = ref<Record<number, { lot_number: string; quantity: string; expiry_date: string }>>({});
    const form = ref({ supplier_id: '', expected_at: '', notes: '' });
    const poLines = ref<{ product_id: string; quantity_ordered: string; unit_cost: string }[]>([
      { product_id: '', quantity_ordered: '', unit_cost: '' },
    ]);

    const { data: orders, isLoading } = useQuery({
      queryKey: ['purchase-orders'],
      queryFn: async () => {
        const { data: res } = await api.get('/purchase-orders', { params: { limit: 30 } });
        return pageItems<PurchaseOrder>(res).data;
      },
    });

    const { data: suppliers } = useQuery({
      queryKey: ['suppliers'],
      queryFn: async () => {
        const { data } = await api.get('/suppliers', { params: { limit: 100 } });
        return pageItems<Supplier>(unwrap(data)).data;
      },
    });

    const { data: products } = useQuery({
      queryKey: ['products-po'],
      queryFn: async () => {
        const { data: res } = await api.get('/products', { params: { active_only: true, limit: 200 } });
        return pageItems<Product>(res).data;
      },
    });

    const supplierOptions = computed(() => (suppliers.value ?? []).map((s) => ({ value: String(s.id), label: s.name })));
    const productOptions = computed(() => (products.value ?? []).map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })));

    const createPo = useMutation({
      mutationFn: () => api.post('/purchase-orders', {
        supplier_id: Number(form.value.supplier_id),
        expected_at: form.value.expected_at || undefined,
        notes: form.value.notes || undefined,
        lines: poLines.value.filter((l) => l.product_id).map((l) => ({
          product_id: Number(l.product_id),
          quantity_ordered: Number(l.quantity_ordered),
          unit_cost: Number(l.unit_cost),
        })),
      }),
      onSuccess: () => {
        toast.add('Commande créée', 'success');
        showForm.value = false;
        queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      },
      onError: () => toast.add('Erreur création', 'error'),
    });

    const sendPo = useMutation({
      mutationFn: (id: number) => api.post(`/purchase-orders/${id}/send`),
      onSuccess: () => { toast.add('Commande envoyée', 'success'); queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); },
      onError: () => toast.add('Envoi impossible', 'error'),
    });

    const receivePo = useMutation({
      mutationFn: (po: PurchaseOrder) => {
        const lines = (po.lines ?? [])
          .filter((l) => receiveLines.value[l.id]?.lot_number && receiveLines.value[l.id]?.quantity)
          .map((l) => ({
            purchase_order_line_id: l.id,
            lot_number: receiveLines.value[l.id].lot_number,
            quantity: Number(receiveLines.value[l.id].quantity),
            expiry_date: receiveLines.value[l.id].expiry_date || undefined,
          }));
        return api.post(`/purchase-orders/${po.id}/receive`, { lines });
      },
      onSuccess: () => {
        toast.add('Réception enregistrée', 'success');
        receivePoId.value = null;
        receiveLines.value = {};
        queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      },
      onError: () => toast.add('Réception impossible', 'error'),
    });

    return () => (
      <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Bons de commande</h1>
            <p class="mt-1 text-slate-600">Commandes fournisseurs et réceptions</p>
          </div>
          <Button class="bg-cyan-600" onClick={() => { showForm.value = !showForm.value; }}>{showForm.value ? 'Annuler' : 'Nouvelle commande'}</Button>
        </div>

        {showForm.value && (
          <Card class="border-cyan-100 p-6">
            <h3 class="mb-4 font-semibold text-cyan-900">Créer un bon de commande</h3>
            <div class="grid gap-3 sm:grid-cols-3">
              <SearchableSelect modelValue={form.value.supplier_id} onUpdate:modelValue={(v: string) => { form.value.supplier_id = v; }} options={supplierOptions.value} placeholder="Fournisseur *" />
              <Input type="date" v-model={form.value.expected_at} />
              <Input v-model={form.value.notes} placeholder="Notes" />
            </div>
            <div class="mt-4 space-y-2">
              {poLines.value.map((line, i) => (
                <div key={i} class="grid gap-2 sm:grid-cols-4">
                  <SearchableSelect modelValue={line.product_id} onUpdate:modelValue={(v: string) => { line.product_id = v; }} options={productOptions.value} placeholder="Produit" />
                  <Input type="number" v-model={line.quantity_ordered} placeholder="Qté" step={0.01} />
                  <Input type="number" v-model={line.unit_cost} placeholder="Coût unitaire F CFA" />
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => poLines.value.push({ product_id: '', quantity_ordered: '', unit_cost: '' })}>+ Ligne</Button>
            </div>
            <Button class="mt-4 bg-cyan-600" loading={createPo.isPending.value} disabled={!form.value.supplier_id} onClick={() => createPo.mutate()}>Enregistrer</Button>
          </Card>
        )}

        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16"><Spinner /></div>
          ) : !orders.value?.length ? (
            <div class="p-12"><EmptyState title="Aucune commande" /></div>
          ) : (
            <div class="divide-y">
              {orders.value.map((po) => (
                <div key={po.id} class="p-6">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span class="font-mono font-semibold text-cyan-800">{po.number}</span>
                      <Badge variant="default" class="ml-2">{statusLabels[po.status] ?? po.status}</Badge>
                      <p class="mt-1 text-sm text-slate-600">{po.supplier?.name}</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      {po.status === 'DRAFT' && (
                        <Button size="sm" class="bg-cyan-600" loading={sendPo.isPending.value} onClick={() => sendPo.mutate(po.id)}>Envoyer</Button>
                      )}
                      {['SENT', 'PARTIALLY_RECEIVED'].includes(po.status) && (
                        <Button size="sm" variant="outline" onClick={() => { receivePoId.value = receivePoId.value === po.id ? null : po.id; }}>
                          {receivePoId.value === po.id ? 'Masquer réception' : 'Réceptionner'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {po.lines && (
                    <table class="mt-3 w-full text-sm">
                      <thead><tr class="text-left text-slate-500"><th class="py-1">Produit</th><th>Commandé</th><th>Reçu</th><th class="text-right">Coût</th></tr></thead>
                      <tbody>
                        {po.lines.map((l) => (
                          <tr key={l.id}>
                            <td class="py-1">{l.product?.code} {l.product?.name}</td>
                            <td>{l.quantity_ordered}</td>
                            <td>{l.quantity_received}</td>
                            <td class="text-right">{formatMoney(l.unit_cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {receivePoId.value === po.id && po.lines && (
                    <div class="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/30 p-4">
                      <h4 class="mb-3 text-sm font-semibold text-cyan-900">Réception</h4>
                      {po.lines.map((l) => (
                        <div key={l.id} class="mb-3 grid gap-2 sm:grid-cols-4">
                          <span class="self-center text-sm">{l.product?.name}</span>
                          <input
                            type="text"
                            class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="N° lot"
                            value={receiveLines.value[l.id]?.lot_number ?? ''}
                            onInput={(e: Event) => {
                              const v = (e.target as HTMLInputElement).value;
                              receiveLines.value[l.id] = {
                                lot_number: v,
                                quantity: receiveLines.value[l.id]?.quantity ?? '',
                                expiry_date: receiveLines.value[l.id]?.expiry_date ?? '',
                              };
                            }}
                          />
                          <input
                            type="number"
                            class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Qté reçue"
                            value={receiveLines.value[l.id]?.quantity ?? ''}
                            step={0.01}
                            onInput={(e: Event) => {
                              const v = (e.target as HTMLInputElement).value;
                              receiveLines.value[l.id] = {
                                quantity: v,
                                lot_number: receiveLines.value[l.id]?.lot_number ?? '',
                                expiry_date: receiveLines.value[l.id]?.expiry_date ?? '',
                              };
                            }}
                          />
                          <input
                            type="date"
                            class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            value={receiveLines.value[l.id]?.expiry_date ?? ''}
                            onInput={(e: Event) => {
                              const v = (e.target as HTMLInputElement).value;
                              receiveLines.value[l.id] = {
                                expiry_date: v,
                                lot_number: receiveLines.value[l.id]?.lot_number ?? '',
                                quantity: receiveLines.value[l.id]?.quantity ?? '',
                              };
                            }}
                          />
                        </div>
                      ))}
                      <Button size="sm" class="bg-cyan-600" loading={receivePo.isPending.value} onClick={() => receivePo.mutate(po)}>Valider la réception</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  },
});
