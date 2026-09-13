import Card from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { unwrap } from '@/lib/unwrap';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent } from 'vue';
import { RouterLink } from 'vue-router';

interface PharmacyDashboard {
  products_active: number;
  stock_valuation: number;
  open_orders: number;
  low_stock_count: number;
  expiry_alerts_count: number;
  top_dispensed: { id: number; name: string; code: string; qty: number }[];
}

export default defineComponent({
  name: 'PharmacyDashboardPage',
  setup() {
    const { data: stats, isLoading } = useQuery({
      queryKey: ['pharmacy-dashboard'],
      queryFn: async () => {
        const { data } = await api.get('/pharmacy/dashboard');
        return unwrap<PharmacyDashboard>(data);
      },
    });

    return () => (
      <div class="space-y-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Pharmacie</h1>
            <p class="mt-1 text-slate-600">Stock, commandes et dispensations</p>
          </div>
          <RouterLink
            to="/hospital/pharmacy/dispensations"
            class="inline-flex rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 hover:bg-cyan-700"
          >
            Dispensations
          </RouterLink>
        </div>

        {isLoading.value ? (
          <div class="flex justify-center py-24"><Spinner /></div>
        ) : stats.value ? (
          <>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div class="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 p-5 text-white shadow-xl shadow-cyan-500/20">
                <p class="text-sm opacity-90">Produits actifs</p>
                <p class="mt-2 text-3xl font-bold">{stats.value.products_active}</p>
              </div>
              <div class="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-xl shadow-sky-500/20">
                <p class="text-sm opacity-90">Valorisation stock</p>
                <p class="mt-2 text-2xl font-bold">{formatMoney(stats.value.stock_valuation)}</p>
              </div>
              <div class="rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 p-5 text-white shadow-xl shadow-teal-500/20">
                <p class="text-sm opacity-90">Commandes ouvertes</p>
                <p class="mt-2 text-3xl font-bold">{stats.value.open_orders}</p>
              </div>
              <div class="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-xl shadow-amber-500/20">
                <p class="text-sm opacity-90">Stock bas</p>
                <p class="mt-2 text-3xl font-bold">{stats.value.low_stock_count}</p>
              </div>
              <div class="rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 p-5 text-white shadow-xl shadow-rose-500/20">
                <p class="text-sm opacity-90">Péremption proche</p>
                <p class="mt-2 text-3xl font-bold">{stats.value.expiry_alerts_count}</p>
              </div>
            </div>

            <Card class="p-6">
              <h3 class="text-lg font-semibold text-slate-800">Top dispensations (30 jours)</h3>
              {!stats.value.top_dispensed?.length ? (
                <p class="mt-4 text-sm text-slate-500">Aucune dispensation récente</p>
              ) : (
                <ul class="mt-4 space-y-2">
                  {stats.value.top_dispensed.map((p) => (
                    <li key={p.id} class="flex justify-between text-sm">
                      <span><span class="font-mono text-cyan-700">{p.code}</span> {p.name}</span>
                      <span class="font-semibold">{p.qty} unités</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: '/hospital/pharmacy/products', label: 'Produits' },
                { to: '/hospital/pharmacy/stock', label: 'Lots & stock' },
                { to: '/hospital/pharmacy/purchase-orders', label: 'Commandes' },
                { to: '/hospital/pharmacy/alerts', label: 'Alertes stock' },
              ].map((l) => (
                <RouterLink key={l.to} to={l.to} class="rounded-xl border border-cyan-200 bg-white px-4 py-3 text-sm font-semibold text-cyan-800 shadow-sm hover:bg-cyan-50">
                  {l.label} →
                </RouterLink>
              ))}
            </div>
          </>
        ) : null}
      </div>
    );
  },
});
