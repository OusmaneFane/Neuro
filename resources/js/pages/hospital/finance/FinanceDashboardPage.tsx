import BarChart from '@/components/dashboard/BarChart';
import DoughnutChart from '@/components/dashboard/DoughnutChart';
import Card from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { unwrap } from '@/lib/unwrap';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, computed } from 'vue';
import { RouterLink } from 'vue-router';

interface FinanceDashboard {
  revenue_today: number;
  revenue_month: number;
  payments_today: number;
  payments_month: number;
  open_invoices: number;
  balance_due: number;
  third_party_outstanding: number;
  revenue_by_month: Record<string, number>;
  payments_by_mode: Record<string, number>;
}

const paymentModeLabels: Record<string, string> = {
  CASH: 'Espèces',
  MOBILE_MONEY: 'Mobile money',
  CARD: 'Carte',
  BANK_TRANSFER: 'Virement',
  CHEQUE: 'Chèque',
};

export default defineComponent({
  name: 'FinanceDashboardPage',
  setup() {
    const { data: stats, isLoading } = useQuery({
      queryKey: ['finance-dashboard'],
      queryFn: async () => {
        const { data } = await api.get('/finance/dashboard');
        return unwrap<FinanceDashboard>(data);
      },
    });

    const revenueChart = computed(() => {
      if (!stats.value?.revenue_by_month) return { labels: [] as string[], data: [] as number[] };
      const entries = Object.entries(stats.value.revenue_by_month).sort(([a], [b]) => a.localeCompare(b));
      return {
        labels: entries.map(([k]) => k),
        data: entries.map(([, v]) => v),
      };
    });

    const paymentsChart = computed(() => {
      if (!stats.value?.payments_by_mode) return { labels: [] as string[], data: [] as number[] };
      const entries = Object.entries(stats.value.payments_by_mode);
      return {
        labels: entries.map(([k]) => paymentModeLabels[k] ?? k),
        data: entries.map(([, v]) => Number(v)),
      };
    });

    return () => (
      <div class="space-y-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Finances</h1>
            <p class="mt-1 text-slate-600">Tableau de bord financier — recettes, encaissements et créances</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <RouterLink
              to="/hospital/finance/invoices/new"
              class="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
            >
              Nouvelle facture
            </RouterLink>
            <RouterLink
              to="/hospital/finance/cash-register"
              class="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
            >
              Caisse
            </RouterLink>
          </div>
        </div>

        {isLoading.value ? (
          <div class="flex justify-center py-24"><Spinner /></div>
        ) : stats.value ? (
          <>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-500/20">
                <p class="text-sm font-medium opacity-90">Recettes aujourd'hui</p>
                <p class="mt-2 text-3xl font-bold tracking-tight">{formatMoney(stats.value.revenue_today)}</p>
              </div>
              <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 p-6 text-white shadow-xl shadow-teal-500/20">
                <p class="text-sm font-medium opacity-90">Recettes du mois</p>
                <p class="mt-2 text-3xl font-bold tracking-tight">{formatMoney(stats.value.revenue_month)}</p>
              </div>
              <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 p-6 text-white shadow-xl shadow-emerald-600/20">
                <p class="text-sm font-medium opacity-90">Encaissements aujourd'hui</p>
                <p class="mt-2 text-3xl font-bold tracking-tight">{formatMoney(stats.value.payments_today)}</p>
              </div>
              <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 p-6 text-white shadow-xl shadow-cyan-500/20">
                <p class="text-sm font-medium opacity-90">Encaissements du mois</p>
                <p class="mt-2 text-3xl font-bold tracking-tight">{formatMoney(stats.value.payments_month)}</p>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <Card class="border-emerald-100 bg-emerald-50/30 p-5">
                <p class="text-sm font-medium text-emerald-800">Factures ouvertes</p>
                <p class="mt-1 text-2xl font-bold text-emerald-900">{stats.value.open_invoices}</p>
                <RouterLink to="/hospital/finance/invoices" class="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline">
                  Voir les factures →
                </RouterLink>
              </Card>
              <Card class="border-amber-100 bg-amber-50/30 p-5">
                <p class="text-sm font-medium text-amber-800">Solde patient dû</p>
                <p class="mt-1 text-2xl font-bold text-amber-900">{formatMoney(stats.value.balance_due)}</p>
              </Card>
              <Card class="border-teal-100 bg-teal-50/30 p-5">
                <p class="text-sm font-medium text-teal-800">Créances tiers payants</p>
                <p class="mt-1 text-2xl font-bold text-teal-900">{formatMoney(stats.value.third_party_outstanding)}</p>
                <RouterLink to="/hospital/finance/claims" class="mt-2 inline-block text-sm font-semibold text-teal-700 hover:underline">
                  Voir les créances →
                </RouterLink>
              </Card>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <Card class="overflow-hidden p-6">
                <h3 class="text-lg font-semibold text-slate-800">Recettes par mois</h3>
                <p class="mt-1 text-sm text-slate-500">6 derniers mois (F CFA)</p>
                <div class="mt-6">
                  <BarChart
                    labels={revenueChart.value.labels}
                    datasets={[{ label: 'Recettes', data: revenueChart.value.data, color: 'rgba(16, 185, 129, 0.85)' }]}
                    height={280}
                  />
                </div>
              </Card>
              <Card class="overflow-hidden p-6">
                <h3 class="text-lg font-semibold text-slate-800">Encaissements par mode</h3>
                <p class="mt-1 text-sm text-slate-500">Mois en cours</p>
                <div class="mt-6">
                  {paymentsChart.value.data.length ? (
                    <DoughnutChart labels={paymentsChart.value.labels} data={paymentsChart.value.data} height={280} />
                  ) : (
                    <p class="py-12 text-center text-sm text-slate-500">Aucun encaissement ce mois</p>
                  )}
                </div>
              </Card>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: '/hospital/finance/invoices', label: 'Factures' },
                { to: '/hospital/finance/tariffs', label: 'Tarifs & référentiels' },
                { to: '/hospital/finance/analytical', label: 'Rapport analytique' },
                { to: '/hospital/finance/claims', label: 'Tiers payants' },
              ].map((link) => (
                <RouterLink
                  key={link.to}
                  to={link.to}
                  class="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50"
                >
                  {link.label} →
                </RouterLink>
              ))}
            </div>
          </>
        ) : null}
      </div>
    );
  },
});
