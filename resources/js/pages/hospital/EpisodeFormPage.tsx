import PatientFormPageHero from '@/components/patient/PatientFormPageHero';
import { DOSSIER_NEUTRAL_CARD, DOSSIER_PAGE_STACK } from '@/components/patient/dossierPageUi';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { SearchableSelectOption } from '@/components/ui/SearchableSelect';
import { api } from '@/lib/api';
import { useToastStore } from '@/stores/toast';
import icd11Neuro from '@/data/icd11-neuro.json';
import { NEURO_CONSULTATION_MOTIFS } from '@/data/motifs-consultation-neuro';
import { NEURO_THERAPEUTIC_PATHWAYS } from '@/data/parcours-therapeutique-neuro';
import { NEURO_PROVENANCES } from '@/data/provenance-neuro';
import { ArrowLeft, CheckCircle2, Stethoscope } from 'lucide-vue-next';
import { defineComponent, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface Icd11Item {
  code: string;
  name: string;
}

const icd11List = icd11Neuro as Icd11Item[];
const MOTIF_AUTRE = '__autre__';
const PATHWAY_AUTRE = '__autre_pathway__';
const PROVENANCE_AUTRE = '__autre_provenance__';

const diagnosisOptions: SearchableSelectOption[] = [
  ...icd11List.map((x) => ({ value: x.code, label: `${x.code} — ${x.name}` })),
  { value: '__autre__', label: '— Autre (saisie libre) —' },
];

const consultationMotifOptions: SearchableSelectOption[] = [
  ...NEURO_CONSULTATION_MOTIFS.map((m) => ({ value: m, label: m })),
  { value: MOTIF_AUTRE, label: '— Autre motif (saisie libre) —' },
];

const therapeuticPathwayOptions: SearchableSelectOption[] = [
  ...NEURO_THERAPEUTIC_PATHWAYS.map((p) => ({ value: p, label: p })),
  { value: PATHWAY_AUTRE, label: '— Autre parcours (saisie libre) —' },
];

const provenanceOptions: SearchableSelectOption[] = [
  ...NEURO_PROVENANCES.map((p) => ({ value: p, label: p })),
  { value: PROVENANCE_AUTRE, label: '— Autre provenance (saisie libre) —' },
];

const field =
  'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const sectionHeadSlate =
  'border-b border-slate-100 bg-linear-to-r from-slate-100/50 to-transparent px-6 py-4 sm:px-8';
const sectionHeadPrimary =
  'border-b border-primary/10 bg-linear-to-r from-primary/8 to-transparent px-6 py-4 sm:px-8';
const sectionBody = 'space-y-5 px-6 py-6 sm:px-8';

export default defineComponent({
  name: 'EpisodeFormPage',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToastStore();
    const patientId = route.params.id as string;
    const loading = ref(false);
    const diagnosisSelect = ref('');
    const consultationMotifSelect = ref('');
    const therapeuticPathwaySelect = ref('');
    const provenanceSelect = ref('');
    const form = ref({
      type: 'CONSULTATION' as const,
      transport_mean: '' as '' | 'taxi' | 'ambulance' | 'personnel',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
      reason: '',
      therapeutic_pathway: '',
      provenance: '',
      medical_history: '',
      dietary_habits: '',
      clinical_exam: '',
      diagnosis: '',
      notes: '',
    });

    async function submit() {
      loading.value = true;
      try {
        await api.post(`/patients/${patientId}/episodes`, {
          ...form.value,
          end_date: form.value.end_date || undefined,
          transport_mean: form.value.transport_mean || undefined,
          therapeutic_pathway: form.value.therapeutic_pathway || undefined,
          provenance: form.value.provenance || undefined,
        });
        toast.add('Observation médicale créée', 'success');
        router.push(`/hospital/patients/${patientId}/notes-cliniques`);
      } catch {
        toast.add('Erreur lors de la création', 'error');
      } finally {
        loading.value = false;
      }
    }

    return () => (
      <div class={`mx-auto max-w-3xl ${DOSSIER_PAGE_STACK}`}>
        <PatientFormPageHero
          title="Nouvelle observation médicale"
          description="Consultation, hospitalisation ou urgence : saisie structurée alignée sur le dossier neurologique."
        >
          {{
            icon: () => <Stethoscope class="h-7 w-7" strokeWidth={2.25} />,
            actions: () => (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                class="inline-flex items-center gap-2 rounded-xl border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium shadow-sm backdrop-blur-sm transition hover:bg-white"
              >
                <ArrowLeft class="h-4 w-4" strokeWidth={2.25} />
                Retour
              </Button>
            ),
          }}
        </PatientFormPageHero>

        <Card class={DOSSIER_NEUTRAL_CARD}>
          <form onSubmit={(e: Event) => { e.preventDefault(); submit(); }} class="pb-0">
            <div class="border-b border-slate-100 last:border-b-0">
              <div class={sectionHeadSlate}>
                <h3 class="text-sm font-semibold tracking-tight text-slate-900">Séjour et accès</h3>
                <p class="mt-0.5 text-xs text-slate-500">
                  Type d’épisode, provenance, transport et dates.
                </p>
              </div>
              <div class={sectionBody}>
                <div class="grid gap-5 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label class="mb-2 block text-sm font-medium text-slate-700">Provenance</label>
                    <p class="mb-2 text-xs text-slate-500">
                      Origine de la prise en charge ou mode d’orientation vers le service.
                    </p>
                    <SearchableSelect
                      modelValue={provenanceSelect.value}
                      onUpdate:modelValue={(v: string) => {
                        provenanceSelect.value = v;
                        if (v === PROVENANCE_AUTRE) form.value.provenance = '';
                        else form.value.provenance = v ?? '';
                      }}
                      options={provenanceOptions}
                      placeholder="Rechercher ou choisir une provenance…"
                      class="w-full"
                    />
                    {provenanceSelect.value === PROVENANCE_AUTRE ? (
                      <textarea
                        v-model={form.value.provenance}
                        rows={2}
                        maxlength={255}
                        placeholder="Préciser la provenance (max. 255 caractères)…"
                        class={`mt-2 ${field}`}
                      />
                    ) : null}
                  </div>
                  <div class="sm:col-span-2">
                    <label class="mb-2 block text-sm font-medium text-slate-700">Type</label>
                    <select v-model={form.value.type} class={field}>
                      <option value="CONSULTATION">Consultation</option>
                      <option value="HOSPITALIZATION">Hospitalisation</option>
                      <option value="EMERGENCY">Urgence</option>
                    </select>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="mb-2 block text-sm font-medium text-slate-700">Moyen de transport</label>
                    <select v-model={form.value.transport_mean} class={field}>
                      <option value="">— Choisir —</option>
                      <option value="taxi">Taxi</option>
                      <option value="ambulance">Ambulance</option>
                      <option value="personnel">Moyen personnel</option>
                    </select>
                  </div>
                  <Input v-model={form.value.start_date} label="Date d’entrée" type="date" />
                  <Input v-model={form.value.end_date} label="Date de sortie" type="date" />
                </div>
              </div>
            </div>

            <div class="border-b border-slate-100 last:border-b-0">
              <div class={sectionHeadPrimary}>
                <h3 class="text-sm font-semibold tracking-tight text-slate-900">Motif et anamnèse</h3>
                <p class="mt-0.5 text-xs text-slate-500">
                  Motifs types neurologie ; détails dans l’histoire de la maladie si besoin.
                </p>
              </div>
              <div class={sectionBody}>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Motif de consultation</label>
                  <SearchableSelect
                    modelValue={consultationMotifSelect.value}
                    onUpdate:modelValue={(v: string) => {
                      consultationMotifSelect.value = v;
                      if (v === MOTIF_AUTRE) form.value.reason = '';
                      else form.value.reason = v ?? '';
                    }}
                    options={consultationMotifOptions}
                    placeholder="Rechercher ou choisir un motif de consultation…"
                    class="w-full"
                  />
                  {consultationMotifSelect.value === MOTIF_AUTRE ? (
                    <textarea
                      v-model={form.value.reason}
                      rows={2}
                      maxlength={255}
                      placeholder="Préciser le motif (max. 255 caractères)…"
                      class={`mt-2 ${field}`}
                    />
                  ) : null}
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Histoire de la maladie</label>
                  <textarea v-model={form.value.medical_history} rows={4} class={field} />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Habitudes alimentaires</label>
                  <textarea v-model={form.value.dietary_habits} rows={2} class={field} />
                </div>
              </div>
            </div>

            <div class="border-b border-slate-100 last:border-b-0">
              <div class={sectionHeadSlate}>
                <h3 class="text-sm font-semibold tracking-tight text-slate-900">Parcours thérapeutique</h3>
                <p class="mt-0.5 text-xs text-slate-500">
                  Orientation prévue ou en cours (ambulatoire, bilan, hospitalisation, rééducation, avis…).
                </p>
              </div>
              <div class={sectionBody}>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Parcours envisagé</label>
                  <SearchableSelect
                    modelValue={therapeuticPathwaySelect.value}
                    onUpdate:modelValue={(v: string) => {
                      therapeuticPathwaySelect.value = v;
                      if (v === PATHWAY_AUTRE) form.value.therapeutic_pathway = '';
                      else form.value.therapeutic_pathway = v ?? '';
                    }}
                    options={therapeuticPathwayOptions}
                    placeholder="Rechercher ou choisir un parcours…"
                    class="w-full"
                  />
                  {therapeuticPathwaySelect.value === PATHWAY_AUTRE ? (
                    <textarea
                      v-model={form.value.therapeutic_pathway}
                      rows={2}
                      maxlength={255}
                      placeholder="Préciser le parcours (max. 255 caractères)…"
                      class={`mt-2 ${field}`}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div class="border-b border-slate-100 last:border-b-0">
              <div class={sectionHeadSlate}>
                <h3 class="text-sm font-semibold tracking-tight text-slate-900">Examen et notes</h3>
                <p class="mt-0.5 text-xs text-slate-500">Sémiologie et remarques libres.</p>
              </div>
              <div class={sectionBody}>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Examen clinique</label>
                  <textarea v-model={form.value.clinical_exam} rows={4} class={field} />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                  <textarea v-model={form.value.notes} rows={3} class={field} />
                </div>
              </div>
            </div>

            <div class="border-b border-slate-100 last:border-b-0">
              <div class={sectionHeadSlate}>
                <h3 class="text-sm font-semibold tracking-tight text-slate-900">Diagnostic (ICD-11 neurologie)</h3>
                <p class="mt-0.5 text-xs text-slate-500">Recherche par code ou libellé ; autre diagnostic possible.</p>
              </div>
              <div class={sectionBody}>
                <SearchableSelect
                  modelValue={diagnosisSelect.value}
                  onUpdate:modelValue={(v: string) => {
                    diagnosisSelect.value = v;
                    if (v === '__autre__') form.value.diagnosis = '';
                    else if (v) {
                      const item = icd11List.find((x) => x.code === v);
                      if (item) form.value.diagnosis = `${item.code} — ${item.name}`;
                    } else form.value.diagnosis = '';
                  }}
                  options={diagnosisOptions}
                  placeholder="Rechercher ou choisir un diagnostic…"
                  class="w-full"
                />
                {diagnosisSelect.value === '__autre__' ? (
                  <textarea
                    v-model={form.value.diagnosis}
                    rows={2}
                    placeholder="Préciser le diagnostic…"
                    class={field}
                  />
                ) : null}
              </div>
            </div>

            <div class="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p class="text-xs text-slate-500">
                Après enregistrement, vous serez redirigé vers les notes cliniques du patient.
              </p>
              <div class="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  class="rounded-xl"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  loading={loading.value}
                  class="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base shadow-lg shadow-primary/30"
                >
                  <CheckCircle2 class="h-5 w-5" strokeWidth={2.25} />
                  Créer l’observation
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    );
  },
});
