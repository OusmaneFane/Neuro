import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { canAccessClinicalNav } from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import type { Patient } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { computed, defineComponent, ref } from 'vue';
import { useRoute } from 'vue-router';

function computeAge(birthDate: string | undefined): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? `${age} ans` : '—';
}

export default defineComponent({
  name: 'PatientRecordHeader',
  setup() {
    const auth = useAuthStore();
    const route = useRoute();
    const toast = useToastStore();
    const patientId = computed(() => route.params.id as string);
    const showPdfModal = ref(false);
    const pdfLoading = ref(false);
    const canDownloadDossier = computed(() => canAccessClinicalNav(auth.user?.role));

    const { data: patient, isLoading } = useQuery({
      queryKey: ['patient', patientId],
      queryFn: async () => {
        const { data } = await api.get<Patient>(`/patients/${patientId.value}`);
        return data;
      },
      enabled: !!patientId.value,
    });

    const age = computed(() => computeAge(patient.value?.birth_date));

    async function downloadDossierPdf() {
      if (!patientId.value) return;
      pdfLoading.value = true;
      try {
        const { data } = await api.get<Blob>(`/patients/${patientId.value}/dossier-pdf`, {
          responseType: 'blob',
        });
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dossier-patient-${patient.value?.iup ?? patientId.value}-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.add('Téléchargement du dossier PDF démarré', 'success');
        showPdfModal.value = false;
      } catch {
        toast.add('Impossible de générer le dossier PDF', 'error');
      } finally {
        pdfLoading.value = false;
      }
    }

    return () => {
      if (isLoading.value || !patient.value) {
        return (
          <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Spinner />
            <span class="text-sm text-slate-500">Chargement…</span>
          </div>
        );
      }
      const p = patient.value;
      const parts = [
        ['ID', p.iup],
        ['Téléphone', p.phone ?? '—'],
        ['Nom', p.last_name],
        ['Prénom', p.first_name],
        ['Âge', age.value],
      ];
      return (
        <>
          <header class="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                {parts.map(([label, value]) => (
                  <span key={label} class="flex items-baseline gap-2">
                    <span class="font-medium text-slate-500">{label}</span>
                    <span class="font-semibold text-slate-800">{value}</span>
                  </span>
                ))}
              </div>
              {canDownloadDossier.value ? (
                <Button
                  variant="outline"
                  size="sm"
                  class="shrink-0 rounded-xl border-amber-200 bg-amber-50/80 text-amber-800 hover:bg-amber-100"
                  onClick={() => { showPdfModal.value = true; }}
                >
                  <span class="mr-1.5">↓</span>
                  Télécharger le dossier (PDF)
                </Button>
              ) : null}
            </div>
          </header>
          {showPdfModal.value && (
            <div
              class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
              onClick={() => { if (!pdfLoading.value) showPdfModal.value = false; }}
            >
              <div
                class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
                onClick={(e: Event) => e.stopPropagation()}
              >
                <div class="flex items-center gap-3 text-amber-600">
                  <span class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <h3 class="text-lg font-semibold text-slate-800">Document confidentiel</h3>
                </div>
                <p class="mt-4 text-sm text-slate-600">
                  Le dossier patient au format PDF contient des données de santé à caractère personnel. Son téléchargement est <strong>tracé</strong> (identité, date, heure) à des fins de sécurité et d’audit.
                </p>
                <p class="mt-2 text-sm text-slate-600">
                  En téléchargeant, vous confirmez utiliser ce document dans le cadre strict de votre activité professionnelle.
                </p>
                <div class="mt-6 flex gap-3">
                  <Button
                    loading={pdfLoading.value}
                    class="rounded-xl bg-primary shadow-lg shadow-primary/25"
                    onClick={downloadDossierPdf}
                  >
                    Confirmer et télécharger
                  </Button>
                  <Button
                    variant="outline"
                    class="rounded-xl"
                    disabled={pdfLoading.value}
                    onClick={() => { showPdfModal.value = false; }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    };
  },
});
