import BarChart from '@/components/dashboard/BarChart';
import DoughnutChart from '@/components/dashboard/DoughnutChart';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/spinner';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';
import type { Document, Paginated } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useToastStore } from '@/stores/toast';

interface DocumentStats {
  total_count: number;
  total_size: number;
  this_month: number;
  by_type: Record<string, number>;
  trend_labels: string[];
  trend: number[];
}

const docTypeLabels: Record<string, string> = {
  LAB: 'Biologie',
  IMAGING: 'Imagerie',
  PRESCRIPTION: 'Ordonnance',
  DISCHARGE: 'Sortie',
  ADMIN: 'Administratif',
  OTHER: 'Autre',
};

const docTypeColors: Record<string, string> = {
  LAB: 'from-emerald-500 to-teal-600',
  IMAGING: 'from-sky-500 to-blue-600',
  PRESCRIPTION: 'from-amber-500 to-orange-500',
  DISCHARGE: 'from-violet-500 to-purple-600',
  ADMIN: 'from-slate-600 to-slate-700',
  OTHER: 'from-rose-500 to-pink-600',
};

const docIconPath = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

export default defineComponent({
  name: 'DocumentsRecentPage',
  setup() {
    const toast = useToastStore();
    const loadingDocId = ref<number | null>(null);
    const page = ref(1);
    const filterType = ref<string | null>(null);

    const { data: stats, isLoading: statsLoading } = useQuery({
      queryKey: ['documents-stats'],
      queryFn: async () => {
        const { data } = await api.get<DocumentStats>('/documents/stats');
        return data;
      },
    });

    const { data, isLoading } = useQuery({
      queryKey: ['documents-recent', page, filterType],
      queryFn: async () => {
        const params: Record<string, unknown> = { page: page.value, limit: 20 };
        if (filterType.value) params['type'] = filterType.value;
        const { data: res } = await api.get<Paginated<Document>>('/documents/recent', { params });
        return res;
      },
    });

    const topTypes = computed(() => {
      if (!stats.value) return [];
      return Object.entries(stats.value.by_type)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6);
    });

    async function openDocument(doc: Document, patientId: number, disposition: 'inline' | 'attachment' = 'inline') {
      loadingDocId.value = doc.id;
      try {
        const { data: blob } = await api.get<Blob>(`/patients/${patientId}/documents/${doc.id}`, {
          responseType: 'blob',
          params: { disposition },
        });
        const url = URL.createObjectURL(blob);
        if (disposition === 'attachment') {
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.filename;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          window.open(url, '_blank', 'noopener');
        }
      } catch {
        toast.add('Impossible d\'ouvrir le document', 'error');
      } finally {
        loadingDocId.value = null;
      }
    }

    return () => (
      <div class="space-y-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Gestion des documents
            </h1>
            <p class="mt-1 text-slate-600">
              Numérisation et suivi des documents médicaux
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <RouterLink
              to="/hospital/dashboard"
              class="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Tableau de bord
            </RouterLink>
          </div>
        </div>

        {statsLoading.value ? (
          <div class="flex justify-center py-12">
            <Spinner />
          </div>
        ) : stats.value ? (
          <>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div class="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-teal-500 to-emerald-600 p-6 text-white shadow-xl shadow-teal-500/25">
                <div class="flex items-center gap-4">
                  <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <div>
                    <p class="text-sm font-medium text-teal-100">Total documents</p>
                    <p class="text-3xl font-bold tracking-tight">{stats.value.total_count.toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                <p class="mt-4 text-xs text-teal-100/90">Dossiers numérisés</p>
              </div>

              <div class="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-sky-500 to-blue-600 p-6 text-white shadow-xl shadow-sky-500/25">
                <div class="flex items-center gap-4">
                  <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </span>
                  <div>
                    <p class="text-sm font-medium text-sky-100">Espace utilisé</p>
                    <p class="text-2xl font-bold tracking-tight">{formatSize(stats.value.total_size)}</p>
                  </div>
                </div>
                <p class="mt-4 text-xs text-sky-100/90">Stockage total</p>
              </div>

              <div class="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl shadow-amber-500/25">
                <div class="flex items-center gap-4">
                  <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <p class="text-sm font-medium text-amber-100">Ce mois</p>
                    <p class="text-3xl font-bold tracking-tight">{stats.value.this_month}</p>
                  </div>
                </div>
                <p class="mt-4 text-xs text-amber-100/90">Ajoutés ce mois</p>
              </div>

              <div class="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-xl shadow-violet-500/25">
                <div class="flex items-center gap-4">
                  <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                  <div>
                    <p class="text-sm font-medium text-violet-100">Catégories</p>
                    <p class="text-3xl font-bold tracking-tight">{topTypes.value.filter(([, v]) => v > 0).length}</p>
                  </div>
                </div>
                <p class="mt-4 text-xs text-violet-100/90">Types actifs</p>
              </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <Card class="overflow-hidden p-6 shadow-lg">
                <h3 class="text-lg font-semibold text-slate-800">Évolution de la numérisation</h3>
                <p class="mt-1 text-sm text-slate-500">Documents ajoutés par mois (6 derniers mois)</p>
                <div class="mt-6">
                  <BarChart
                    labels={stats.value.trend_labels}
                    datasets={[
                      { label: 'Documents', data: stats.value.trend, color: 'rgba(20, 184, 166, 0.85)' },
                    ]}
                    height={240}
                  />
                </div>
              </Card>

              <Card class="overflow-hidden p-6 shadow-lg">
                <h3 class="text-lg font-semibold text-slate-800">Répartition par catégorie</h3>
                <p class="mt-1 text-sm text-slate-500">Types de documents numérisés</p>
                <div class="mt-6">
                  <DoughnutChart
                    labels={Object.entries(stats.value.by_type).map(([k]) => docTypeLabels[k] ?? k)}
                    data={Object.values(stats.value.by_type)}
                    height={240}
                  />
                </div>
              </Card>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                onClick={() => { filterType.value = null; }}
                class={[
                  'rounded-xl px-4 py-2 text-sm font-medium transition',
                  !filterType.value
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                ]}
              >
                Tous
              </button>
              {Object.keys(stats.value.by_type).map((type) => (
                <button
                  key={type}
                  onClick={() => { filterType.value = filterType.value === type ? null : type; }}
                  class={[
                    'rounded-xl px-4 py-2 text-sm font-medium transition',
                    filterType.value === type
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  ]}
                >
                  {docTypeLabels[type] ?? type}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <Card class="overflow-hidden shadow-lg">
          <div class="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h3 class="text-lg font-semibold text-slate-800">Documents récents</h3>
            <p class="mt-1 text-sm text-slate-500">
              Derniers documents numérisés {filterType.value ? `— ${docTypeLabels[filterType.value] ?? filterType.value}` : ''}
            </p>
          </div>
          {isLoading.value ? (
            <div class="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !data.value?.data?.length ? (
            <div class="p-12">
              <EmptyState
                title="Aucun document"
                description="Aucun document n'a été numérisé pour le moment."
              />
            </div>
          ) : (
            <div class="divide-y divide-slate-100">
              {data.value?.data.map((doc) => (
                <div
                  key={doc.id}
                  class="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div class="flex min-w-0 flex-1 items-start gap-4">
                    <span class={[
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                      `bg-gradient-to-br ${docTypeColors[doc.type] ?? docTypeColors.OTHER} text-white`,
                    ]}>
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={docIconPath} />
                      </svg>
                    </span>
                    <div class="min-w-0">
                      <p class="font-semibold text-slate-800 truncate">{doc.filename}</p>
                      <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        {doc.patient && (
                          <RouterLink
                            to={`/hospital/patients/${doc.patient_id}`}
                            class="font-medium text-teal-600 hover:text-teal-700"
                          >
                            {doc.patient.full_name}
                          </RouterLink>
                        )}
                        <span>—</span>
                        <span class="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {docTypeLabels[doc.type] ?? doc.type}
                        </span>
                        <span>{formatSize(doc.size)}</span>
                      </p>
                    </div>
                  </div>
                  <div class="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:justify-start">
                    {doc.patient && doc.patient_id && (
                      <RouterLink
                        to={`/hospital/patients/${doc.patient_id}`}
                        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Dossier patient
                      </RouterLink>
                    )}
                    {doc.is_viewable && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingDocId.value === doc.id}
                        onClick={() => openDocument(doc, doc.patient_id!)}
                      >
                        {loadingDocId.value === doc.id ? '…' : 'Voir'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={loadingDocId.value === doc.id}
                      onClick={() => openDocument(doc, doc.patient_id!, 'attachment')}
                    >
                      {loadingDocId.value === doc.id ? '…' : 'Télécharger'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  },
});
