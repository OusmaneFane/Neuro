import { api } from '@/lib/api';
import { defineComponent, computed, ref } from 'vue';
import { useRoute } from 'vue-router';

interface ShareData {
  patient: {
    iup: string;
    full_name: string;
    birth_date?: string;
    sex: string;
    status: string;
    phone?: string;
    address?: string;
    emergency_contact?: string;
  };
  episodes_summary?: Array<{ id: number; type: string; start_date?: string; reason?: string }>;
  episodes?: { data: Array<{ type: string; start_date?: string; reason?: string; diagnosis?: string }> };
  documents?: { data: Array<{ filename: string; type: string; size: number }> };
}

const episodeLabels: Record<string, string> = {
  CONSULTATION: 'Consultation',
  HOSPITALIZATION: 'Hospitalisation',
  EMERGENCY: 'Urgence',
};

const docTypeLabels: Record<string, string> = {
  LAB: 'Biologie',
  IMAGING: 'Imagerie',
  PRESCRIPTION: 'Ordonnance',
  DISCHARGE: 'Sortie',
  ADMIN: 'Administratif',
  OTHER: 'Autre',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default defineComponent({
  name: 'ShareViewPage',
  setup() {
    const route = useRoute();
    const token = computed(() => route.params.token as string);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const data = ref<ShareData | null>(null);

    async function fetchData() {
      loading.value = true;
      error.value = null;
      try {
        const { data: res } = await api.get<ShareData>(`/share/${token.value}`);
        data.value = res;
      } catch (err: unknown) {
        const ax = err as { response?: { status?: number; data?: { message?: string } } };
        if (ax.response?.status === 404) {
          error.value = 'Ce lien de partage est invalide ou a expiré.';
        } else {
          error.value = 'Impossible de charger les données partagées.';
        }
      } finally {
        loading.value = false;
      }
    }

    fetchData();

    const episodes = computed(() => {
      const d = data.value;
      if (!d) return [];
      if (d.episodes_summary) return d.episodes_summary;
      if (d.episodes?.data) return d.episodes.data;
      return [];
    });

    const documents = computed(() => data.value?.documents?.data ?? []);
    const isFullScope = computed(() => !!data.value?.documents);

    return () => (
      <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
          {loading.value ? (
            <div class="flex flex-col items-center justify-center py-24">
              <div class="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
              <p class="mt-4 text-slate-600">Chargement du dossier partagé...</p>
            </div>
          ) : error.value ? (
            <div class="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-xl">
              <div class="flex flex-col items-center px-8 py-16 text-center sm:py-20">
                <span class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <h1 class="mt-6 text-xl font-bold text-slate-900 sm:text-2xl">
                  Lien expiré ou invalide
                </h1>
                <p class="mt-3 max-w-sm text-slate-600">{error.value}</p>
              </div>
            </div>
          ) : data.value ? (
            <>
              <div class="mb-8 flex items-center gap-3">
                <img src="/DoniSante-icon.png" alt="DoniSanté" class="h-10 w-10 rounded-xl object-cover" />
                <div>
                  <h1 class="text-lg font-semibold text-slate-800">Dossier médical partagé</h1>
                  <p class="text-sm text-slate-500">Accès sécurisé DoniSanté</p>
                </div>
              </div>

              <div class="space-y-6">
                <div class="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-teal-600 to-teal-700 shadow-xl">
                  <div class="px-6 py-8 sm:px-8 sm:py-10">
                    <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 class="text-2xl font-bold text-white sm:text-3xl">
                          {data.value.patient.full_name}
                        </h2>
                        <p class="mt-2 font-mono text-sm text-teal-100">ID: {data.value.patient.iup}</p>
                        <div class="mt-4 flex flex-wrap gap-2">
                          <span class="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
                            {data.value.patient.sex}
                          </span>
                          <span class="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
                            {data.value.patient.status}
                          </span>
                          {data.value.patient.birth_date && (
                            <span class="rounded-full bg-white/20 px-3 py-1 text-sm text-teal-100">
                              Né(e) le {data.value.patient.birth_date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {(data.value.patient.phone || data.value.patient.address || data.value.patient.emergency_contact) && (
                      <div class="mt-8 grid gap-4 border-t border-white/20 pt-6 sm:grid-cols-3">
                        {data.value.patient.phone && (
                          <div>
                            <p class="text-xs font-medium uppercase tracking-wider text-teal-200">Téléphone</p>
                            <p class="mt-1 font-medium text-white">{data.value.patient.phone}</p>
                          </div>
                        )}
                        {data.value.patient.address && (
                          <div>
                            <p class="text-xs font-medium uppercase tracking-wider text-teal-200">Adresse</p>
                            <p class="mt-1 font-medium text-white">{data.value.patient.address}</p>
                          </div>
                        )}
                        {data.value.patient.emergency_contact && (
                          <div>
                            <p class="text-xs font-medium uppercase tracking-wider text-teal-200">Contact d'urgence</p>
                            <p class="mt-1 font-medium text-white">{data.value.patient.emergency_contact}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                  <div class="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-800">
                      <svg class="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Observations médicales
                    </h3>
                  </div>
                  <div class="divide-y divide-slate-100 p-6">
                    {episodes.value.length ? (
                      episodes.value.map((e: { id?: number; type: string; start_date?: string; reason?: string; provenance?: string; therapeutic_pathway?: string; diagnosis?: string }, i: number) => (
                        <div
                          key={e.id ?? i}
                          class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <span class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              {episodeLabels[e.type] ?? e.type}
                            </span>
                            <p class="mt-2 font-medium text-slate-800">{e.reason ?? '—'}</p>
                            {e.provenance ? (
                              <p class="mt-1 text-sm text-slate-600">Provenance : {e.provenance}</p>
                            ) : null}
                            {e.therapeutic_pathway ? (
                              <p class="mt-1 text-sm text-slate-600">Parcours : {e.therapeutic_pathway}</p>
                            ) : null}
                            <p class="text-sm text-slate-500">{e.start_date}</p>
                            {'diagnosis' in e && e.diagnosis && (
                              <p class="mt-1 text-sm text-slate-600">{e.diagnosis}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p class="py-8 text-center text-slate-500">Aucune observation médicale enregistrée</p>
                    )}
                  </div>
                </div>

                {isFullScope.value && documents.value.length > 0 && (
                  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <div class="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                      <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-800">
                        <svg class="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Documents
                      </h3>
                    </div>
                    <div class="divide-y divide-slate-100 p-6">
                      {documents.value.map((doc) => (
                        <div
                          key={doc.filename}
                          class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div class="min-w-0 flex-1">
                            <p class="truncate font-medium text-slate-800">{doc.filename}</p>
                            <p class="flex items-center gap-2 text-sm text-slate-500">
                              <span class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {docTypeLabels[doc.type] ?? doc.type}
                              </span>
                              <span>{formatSize(doc.size)}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div class="rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-center">
                  <p class="text-sm text-slate-500">
                    Ce dossier a été partagé de manière sécurisée via DoniSanté
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  },
});
