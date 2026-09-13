import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { unwrap } from '@/lib/unwrap';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent } from 'vue';
import { RouterLink } from 'vue-router';

interface AlertProduct {
  id: number;
  code: string;
  name: string;
  stock_total?: number;
  min_stock?: number;
}

interface ExpiryLot {
  id: number;
  lot_number: string;
  qty_on_hand: number;
  expiry_date: string;
  product?: { code: string; name: string };
}

interface Alerts {
  low_stock: AlertProduct[];
  expiry: ExpiryLot[];
}

export default defineComponent({
  name: 'StockAlertsPage',
  setup() {
    const { data: alerts, isLoading } = useQuery({
      queryKey: ['stock-alerts'],
      queryFn: async () => {
        const { data } = await api.get('/stock/alerts');
        return unwrap<Alerts>(data);
      },
    });

    return () => (
      <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Alertes stock</h1>
            <p class="mt-1 text-slate-600">Produits en rupture ou péremption proche</p>
          </div>
          <RouterLink to="/hospital/pharmacy/stock" class="text-sm font-semibold text-cyan-700 hover:underline">
            ← Lots & stock
          </RouterLink>
        </div>

        {isLoading.value ? (
          <div class="flex justify-center py-16"><Spinner /></div>
        ) : alerts.value ? (
          <div class="grid gap-6 lg:grid-cols-2">
            <Card class="overflow-hidden p-0">
              <div class="border-b border-amber-200 bg-amber-50 px-6 py-3">
                <h3 class="font-semibold text-amber-900">Stock bas ({alerts.value.low_stock.length})</h3>
              </div>
              {!alerts.value.low_stock.length ? (
                <div class="p-8"><EmptyState title="Aucune alerte stock bas" description="Tous les produits sont au-dessus du seuil minimum." /></div>
              ) : (
                <ul class="divide-y">
                  {alerts.value.low_stock.map((p) => (
                    <li key={p.id} class="flex items-center justify-between px-6 py-3">
                      <div>
                        <span class="font-mono text-sm text-amber-800">{p.code}</span>
                        <span class="ml-2">{p.name}</span>
                      </div>
                      <span class="text-sm font-semibold text-amber-700">
                        {p.stock_total ?? 0} / min {p.min_stock ?? 0}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card class="overflow-hidden p-0">
              <div class="border-b border-rose-200 bg-rose-50 px-6 py-3">
                <h3 class="font-semibold text-rose-900">Péremption proche ({alerts.value.expiry.length})</h3>
              </div>
              {!alerts.value.expiry.length ? (
                <div class="p-8"><EmptyState title="Aucune alerte péremption" /></div>
              ) : (
                <ul class="divide-y">
                  {alerts.value.expiry.map((lot) => (
                    <li key={lot.id} class="flex items-center justify-between px-6 py-3">
                      <div>
                        <span class="font-mono text-sm text-rose-800">{lot.product?.code}</span>
                        <span class="ml-2 text-sm">{lot.product?.name}</span>
                        <span class="ml-2 font-mono text-xs text-slate-500">Lot {lot.lot_number}</span>
                      </div>
                      <div class="text-right text-sm">
                        <div class="font-semibold text-rose-700">{lot.expiry_date?.slice(0, 10)}</div>
                        <div class="text-slate-500">Qté {lot.qty_on_hand}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        ) : null}
      </div>
    );
  },
});
