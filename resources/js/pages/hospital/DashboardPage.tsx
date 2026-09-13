import BarChart from '@/components/dashboard/BarChart';
import DoughnutChart from '@/components/dashboard/DoughnutChart';
import Card from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import {
  CLINICAL_WRITE_ROLES,
  canAccessClinicalNav,
  canAccessFinance,
  canAccessPatients,
  canAccessPharmacy,
  hasRole,
} from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';
import { useQuery } from '@tanstack/vue-query';
import { computed, defineComponent } from 'vue';
import { RouterLink } from 'vue-router';

interface FinanceSummary {
  revenue_today: number;
  payments_today: number;
  open_invoices: number;
  balance_due: number;
}

interface PharmacySummary {
  products_active: number;
  low_stock_count: number;
  expiry_alerts_count: number;
  open_orders: number;
}

interface Stats {
  patients_count: number;
  episodes_count: number;
  documents_count: number;
  episodes_by_type: { CONSULTATION: number; HOSPITALIZATION: number; EMERGENCY: number };
  documents_by_type: Record<string, number>;
  trend_labels: string[];
  patients_trend: number[];
  episodes_trend: number[];
  finance: FinanceSummary | null;
  pharmacy: PharmacySummary | null;
  show_clinical?: boolean;
}

const episodeLabels: Record<string, string> = {
  CONSULTATION: 'Consultation',
  HOSPITALIZATION: 'Hospitalisation',
  EMERGENCY: 'Urgence',
};

const documentLabels: Record<string, string> = {
  LAB: 'Biologie',
  IMAGING: 'Imagerie',
  PRESCRIPTION: 'Ordonnance',
  DISCHARGE: 'Sortie',
  ADMIN: 'Administratif',
  OTHER: 'Autre',
};

export default defineComponent({
  name: 'HospitalDashboard',
  setup() {
    const auth = useAuthStore();
    const role = computed(() => auth.user?.role);

    const showClinical = computed(() => canAccessClinicalNav(role.value));
    const canWriteClinical = computed(() => hasRole(role.value, CLINICAL_WRITE_ROLES));
    const canFinance = computed(() => canAccessFinance(role.value));
    const canPharmacy = computed(() => canAccessPharmacy(role.value));
    const canPatients = computed(() => canAccessPatients(role.value));

    const { data: stats, isLoading } = useQuery({
      queryKey: ['dashboard-stats'],
      queryFn: async () => {
        const { data } = await api.get<Stats>('/dashboard/stats');
        return data;
      },
    });

    return () => (
      <div class="space-y-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Tableau de bord
            </h1>
            <p class="mt-1 text-slate-600">
              Vue d'ensemble DoniSanté
              {showClinical.value && canFinance.value && canPharmacy.value
                ? ' — clinique, finances et pharmacie'
                : showClinical.value
                  ? ' — activité clinique'
                  : canFinance.value
                    ? ' — finances'
                    : canPharmacy.value
                      ? ' — pharmacie'
                      : ''}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            {canWriteClinical.value ? (
              <RouterLink
                to="/hospital/patients/new"
                class="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:opacity-90"
              >
                Nouveau patient
              </RouterLink>
            ) : null}
            {canPatients.value ? (
              <RouterLink
                to="/hospital/patients"
                class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Patients
              </RouterLink>
            ) : null}
            {canFinance.value ? (
              <RouterLink
                to="/hospital/finance/invoices/new"
                class="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
              >
                Nouvelle facture
              </RouterLink>
            ) : null}
            {canPharmacy.value ? (
              <RouterLink
                to="/hospital/pharmacy/dispensations"
                class="inline-flex items-center justify-center rounded-xl border border-cyan-300 bg-cyan-50 px-5 py-2.5 text-sm font-semibold text-cyan-800 shadow-sm transition hover:bg-cyan-100"
              >
                Délivrances
              </RouterLink>
            ) : null}
          </div>
        </div>

        {isLoading.value ? (
          <div class="flex justify-center py-24">
            <Spinner />
          </div>
        ) : stats.value ? (
          <>
            {showClinical.value || canPatients.value ? (
              <div class={[
                'grid gap-4',
                showClinical.value ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-1 lg:grid-cols-1 max-w-md',
              ].join(' ')}>
                <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-6 text-white shadow-xl shadow-primary/20">
                  <p class="text-sm font-medium opacity-90">Patients</p>
                  <p class="mt-2 text-4xl font-bold tracking-tight">{stats.value.patients_count}</p>
                  <RouterLink to="/hospital/patients" class="mt-3 inline-block text-sm font-semibold underline decoration-2 underline-offset-2 opacity-95 hover:opacity-100">
                    Voir la liste →
                  </RouterLink>
                </div>
                {showClinical.value ? (
                  <>
                    <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-6 text-white shadow-xl shadow-sky-500/20">
                      <p class="text-sm font-medium opacity-90">Observations médicales</p>
                      <p class="mt-2 text-4xl font-bold tracking-tight">{stats.value.episodes_count}</p>
                      <RouterLink to="/hospital/episodes" class="mt-3 inline-block text-sm font-semibold underline decoration-2 underline-offset-2 opacity-95 hover:opacity-100">
                        Voir les observations →
                      </RouterLink>
                    </div>
                    <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl shadow-amber-500/20">
                      <p class="text-sm font-medium opacity-90">Documents</p>
                      <p class="mt-2 text-4xl font-bold tracking-tight">{stats.value.documents_count}</p>
                      <RouterLink to="/hospital/documents" class="mt-3 inline-block text-sm font-semibold underline decoration-2 underline-offset-2 opacity-95 hover:opacity-100">
                        Voir les documents →
                      </RouterLink>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {(stats.value.finance || stats.value.pharmacy) ? (
              <div class={[
                'grid gap-4',
                stats.value.finance && stats.value.pharmacy ? 'lg:grid-cols-2' : 'lg:grid-cols-1',
              ].join(' ')}>
                {stats.value.finance ? (
                  <Card class="overflow-hidden border-emerald-100 p-0">
                    <div class="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-6 py-4">
                      <div>
                        <h2 class="text-lg font-semibold text-emerald-900">Finances</h2>
                        <p class="text-sm text-emerald-700/80">Recettes, caisse et créances du jour</p>
                      </div>
                      <RouterLink
                        to="/hospital/finance/dashboard"
                        class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Ouvrir →
                      </RouterLink>
                    </div>
                    <div class="grid gap-4 p-6 sm:grid-cols-2">
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Recettes aujourd'hui</p>
                        <p class="mt-1 text-xl font-bold text-slate-900">{formatMoney(stats.value.finance.revenue_today)}</p>
                      </div>
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Encaissements</p>
                        <p class="mt-1 text-xl font-bold text-slate-900">{formatMoney(stats.value.finance.payments_today)}</p>
                      </div>
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Factures ouvertes</p>
                        <p class="mt-1 text-xl font-bold text-slate-900">{stats.value.finance.open_invoices}</p>
                      </div>
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Solde patient dû</p>
                        <p class="mt-1 text-xl font-bold text-amber-700">{formatMoney(stats.value.finance.balance_due)}</p>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-2 border-t border-slate-100 px-6 py-4">
                      {[
                        { to: '/hospital/finance/invoices', label: 'Factures' },
                        { to: '/hospital/finance/cash-register', label: 'Caisse' },
                        { to: '/hospital/finance/claims', label: 'Tiers payant' },
                        { to: '/hospital/finance/analytical', label: 'Analytique' },
                      ].map((l) => (
                        <RouterLink
                          key={l.to}
                          to={l.to}
                          class="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                        >
                          {l.label}
                        </RouterLink>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {stats.value.pharmacy ? (
                  <Card class="overflow-hidden border-cyan-100 p-0">
                    <div class="flex items-center justify-between border-b border-cyan-100 bg-cyan-50/60 px-6 py-4">
                      <div>
                        <h2 class="text-lg font-semibold text-cyan-900">Pharmacie</h2>
                        <p class="text-sm text-cyan-700/80">Stock, alertes et approvisionnements</p>
                      </div>
                      <RouterLink
                        to="/hospital/pharmacy/dashboard"
                        class="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700"
                      >
                        Ouvrir →
                      </RouterLink>
                    </div>
                    <div class="grid gap-4 p-6 sm:grid-cols-2">
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Produits actifs</p>
                        <p class="mt-1 text-xl font-bold text-slate-900">{stats.value.pharmacy.products_active}</p>
                      </div>
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Commandes ouvertes</p>
                        <p class="mt-1 text-xl font-bold text-slate-900">{stats.value.pharmacy.open_orders}</p>
                      </div>
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Stock bas</p>
                        <p class={[
                          'mt-1 text-xl font-bold',
                          stats.value.pharmacy.low_stock_count > 0 ? 'text-amber-600' : 'text-slate-900',
                        ].join(' ')}>
                          {stats.value.pharmacy.low_stock_count}
                        </p>
                      </div>
                      <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Péremption proche</p>
                        <p class={[
                          'mt-1 text-xl font-bold',
                          stats.value.pharmacy.expiry_alerts_count > 0 ? 'text-rose-600' : 'text-slate-900',
                        ].join(' ')}>
                          {stats.value.pharmacy.expiry_alerts_count}
                        </p>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-2 border-t border-slate-100 px-6 py-4">
                      {[
                        { to: '/hospital/pharmacy/products', label: 'Catalogue' },
                        { to: '/hospital/pharmacy/stock', label: 'Stock' },
                        { to: '/hospital/pharmacy/alerts', label: 'Alertes' },
                        { to: '/hospital/pharmacy/dispensations', label: 'Délivrances' },
                      ].map((l) => (
                        <RouterLink
                          key={l.to}
                          to={l.to}
                          class="rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-50"
                        >
                          {l.label}
                        </RouterLink>
                      ))}
                    </div>
                  </Card>
                ) : null}
              </div>
            ) : null}

            <Card class="p-6">
              <h3 class="text-lg font-semibold text-slate-800">Accès rapide</h3>
              <p class="mt-1 text-sm text-slate-500">Raccourcis selon votre rôle</p>
              <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { to: '/hospital/patients', label: 'Patients', desc: 'Dossiers & IUP', show: canPatients.value },
                  { to: '/hospital/episodes', label: 'Observations', desc: 'Consultations & séjours', show: showClinical.value },
                  { to: '/hospital/examens-complementaires', label: 'Examens', desc: 'Complémentaires', show: showClinical.value },
                  { to: '/hospital/documents', label: 'Documents', desc: 'Pièces du dossier', show: showClinical.value },
                  { to: '/hospital/finance/dashboard', label: 'Finances', desc: 'Facturation & caisse', show: canFinance.value },
                  { to: '/hospital/pharmacy/dashboard', label: 'Pharmacie', desc: 'Stock & délivrance', show: canPharmacy.value },
                  { to: '/hospital/cartes', label: 'Cartes', desc: 'Cartes patients', show: showClinical.value },
                  { to: '/hospital/settings', label: 'Paramètres', desc: 'Compte & hôpital', show: true },
                ].filter((l) => l.show).map((l) => (
                  <RouterLink
                    key={l.to}
                    to={l.to}
                    class="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 transition hover:border-primary/40 hover:bg-white hover:shadow-sm"
                  >
                    <p class="text-sm font-semibold text-slate-800">{l.label}</p>
                    <p class="mt-0.5 text-xs text-slate-500">{l.desc}</p>
                  </RouterLink>
                ))}
              </div>
            </Card>

            {showClinical.value ? (
              <>
                <div class="grid gap-6 lg:grid-cols-2">
                  <Card class="overflow-hidden p-6">
                    <h3 class="text-lg font-semibold text-slate-800">Évolution sur 6 mois</h3>
                    <p class="mt-1 text-sm text-slate-500">Nouveaux patients et observations par mois</p>
                    <div class="mt-6">
                      <BarChart
                        labels={stats.value.trend_labels}
                        datasets={[
                          { label: 'Patients', data: stats.value.patients_trend, color: 'rgba(37, 99, 235, 0.8)' },
                          { label: 'Observations', data: stats.value.episodes_trend, color: 'rgba(14, 165, 233, 0.75)' },
                        ]}
                        height={280}
                      />
                    </div>
                  </Card>

                  <Card class="overflow-hidden p-6">
                    <h3 class="text-lg font-semibold text-slate-800">Répartition des observations médicales</h3>
                    <p class="mt-1 text-sm text-slate-500">Par type de prise en charge</p>
                    <div class="mt-6">
                      <DoughnutChart
                        labels={[
                          episodeLabels.CONSULTATION,
                          episodeLabels.HOSPITALIZATION,
                          episodeLabels.EMERGENCY,
                        ]}
                        data={[
                          stats.value.episodes_by_type.CONSULTATION,
                          stats.value.episodes_by_type.HOSPITALIZATION,
                          stats.value.episodes_by_type.EMERGENCY,
                        ]}
                        height={280}
                      />
                    </div>
                  </Card>
                </div>

                <Card class="overflow-hidden p-6">
                  <h3 class="text-lg font-semibold text-slate-800">Répartition des documents</h3>
                  <p class="mt-1 text-sm text-slate-500">Par catégorie</p>
                  <div class="mt-6">
                    <DoughnutChart
                      labels={Object.entries(stats.value.documents_by_type).map(([k]) => documentLabels[k] ?? k)}
                      data={Object.values(stats.value.documents_by_type)}
                      height={260}
                    />
                  </div>
                </Card>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    );
  },
});
