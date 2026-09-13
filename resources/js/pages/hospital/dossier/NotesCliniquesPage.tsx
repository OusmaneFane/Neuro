import PatientFormPageHero from '@/components/patient/PatientFormPageHero';
import PatientAntecedentsAllergiesSection from '@/components/patient/PatientAntecedentsAllergiesSection';
import {
  DOSSIER_CARD_BODY,
  DOSSIER_CARD_HEADER,
  DOSSIER_NEUTRAL_CARD,
  DOSSIER_PAGE_STACK,
} from '@/components/patient/dossierPageUi';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { SearchableSelectOption } from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import icd11Neuro from '@/data/icd11-neuro.json';
import { NEURO_CONSULTATION_MOTIFS } from '@/data/motifs-consultation-neuro';
import { NEURO_THERAPEUTIC_PATHWAYS } from '@/data/parcours-therapeutique-neuro';
import { NEURO_PROVENANCES } from '@/data/provenance-neuro';
import {
  Brain,
  Building2,
  CheckCircle2,
  ClipboardList,
  PillBottle,
  Signpost,
  Stethoscope,
} from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';
import { api } from '@/lib/api';
import type { ClinicalNote } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const PATHWAY_AUTRE = '__autre_pathway__';
const PROVENANCE_AUTRE = '__autre_provenance__';
const therapeuticPathwayOptions: SearchableSelectOption[] = [
  ...NEURO_THERAPEUTIC_PATHWAYS.map((p) => ({ value: p, label: p })),
  { value: PATHWAY_AUTRE, label: '— Autre parcours (saisie libre) —' },
];
const provenanceOptions: SearchableSelectOption[] = [
  ...NEURO_PROVENANCES.map((p) => ({ value: p, label: p })),
  { value: PROVENANCE_AUTRE, label: '— Autre provenance (saisie libre) —' },
];

const MOTIF_AUTRE = '__autre__';
const consultationMotifOptions: SearchableSelectOption[] = [
  ...NEURO_CONSULTATION_MOTIFS.map((m) => ({ value: m, label: m })),
  { value: MOTIF_AUTRE, label: '— Autre motif (saisie libre) —' },
];

interface Icd11Item {
  code: string;
  name: string;
}

const icd11List = icd11Neuro as Icd11Item[];
const diagnosisOptions: SearchableSelectOption[] = [
  ...icd11List.map((x) => ({ value: x.code, label: `${x.code} — ${x.name}` })),
  { value: '__autre__', label: '— Autre (saisie libre) —' },
];

const obsField =
  'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const obsSectionHeadSlate =
  'border-b border-slate-100 bg-linear-to-r from-slate-100/50 to-transparent px-5 py-4 sm:px-6';
const obsSectionHeadPrimary =
  'border-b border-primary/10 bg-linear-to-r from-primary/8 to-transparent px-5 py-4 sm:px-6';
const obsSectionHeadTeal =
  'border-b border-teal-100 bg-linear-to-r from-teal-50/80 to-transparent px-5 py-4 sm:px-6';
const obsSectionHeadViolet =
  'border-b border-violet-100 bg-linear-to-r from-violet-50/80 to-transparent px-5 py-4 sm:px-6';
const obsSectionHeadIndigo =
  'border-b border-indigo-100 bg-linear-to-r from-indigo-50/80 to-transparent px-5 py-4 sm:px-6';
const obsSectionBody = 'space-y-5 px-5 py-5 sm:px-6';

const vitalLabels: { key: string; label: string; unit: string }[] = [
  { key: 'temperature', label: 'Température', unit: '°C' },
  { key: 'pression_arterielle', label: 'Pression artérielle', unit: 'mmHg' },
  { key: 'frequence_cardiaque', label: 'Fréquence cardiaque', unit: 'bpm' },
  { key: 'taille', label: 'Taille', unit: 'm' },
  { key: 'poids', label: 'Poids', unit: 'kg' },
  { key: 'imc', label: 'IMC', unit: 'kg/m²' },
  { key: 'glasgow', label: 'Score Glasgow', unit: '' },
  { key: 'nihss', label: 'Score NIHSS', unit: '' },
  { key: 'rankin', label: 'Score Rankin', unit: '' },
  { key: 'eva', label: 'EVA', unit: '' },
  { key: 'diurese', label: 'Diurèse', unit: 'ml/kg/h' },
  { key: 'glycemie_capillaire', label: 'Glycémie capillaire', unit: 'g/ml' },
  { key: 'spo2', label: 'SpO2', unit: '%' },
  { key: 'surface_corporelle', label: 'Surface corporelle', unit: 'm²' },
];

export default defineComponent({
  name: 'NotesCliniquesPage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const patientId = computed(() => route.params.id as string);
    const queryClient = useQueryClient();
    const content = ref('');
    const isSubmitting = ref(false);
    const showObservationForm = ref(false);

    const vitals = ref<Record<string, string>>({});

    const observationForm = ref({
      type: 'CONSULTATION' as 'CONSULTATION' | 'HOSPITALIZATION' | 'EMERGENCY',
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
    const observationPathwaySelect = ref('');
    const observationProvenanceSelect = ref('');
    const observationConsultationMotifSelect = ref('');
    const observationDiagnosisSelect = ref('');
    const observationSubmitting = ref(false);

    const { data: notes, isLoading } = useQuery({
      queryKey: ['clinical-notes', patientId],
      queryFn: async () => {
        const { data: res } = await api.get<{ data: ClinicalNote[] }>(
          `/patients/${patientId.value}/clinical-notes`
        );
        return res.data;
      },
    });

    const addNote = useMutation({
      mutationFn: async () => {
        const { data: note } = await api.post<ClinicalNote>(
          `/patients/${patientId.value}/clinical-notes`,
          { content: content.value }
        );
        return note;
      },
      onSuccess: () => {
        content.value = '';
        toast.add('Note clinique enregistrée', 'success');
        queryClient.invalidateQueries({ queryKey: ['clinical-notes', patientId] });
      },
      onError: (err: unknown) => {
        const ax = err as {
          response?: { data?: { message?: string; errors?: Record<string, string[]> } };
        };
        const msg =
          ax.response?.data?.errors
            ? Object.values(ax.response.data.errors).flat().join(' ')
            : ax.response?.data?.message ?? 'Erreur lors de l\'enregistrement';
        toast.add(msg, 'error');
      },
    });

    async function handleSubmit() {
      if (!content.value.trim()) return;
      isSubmitting.value = true;
      await addNote.mutateAsync();
      isSubmitting.value = false;
    }

    async function deleteNote(id: number) {
      if (!confirm('Supprimer cette note ?')) return;
      try {
        await api.delete(`/patients/${patientId.value}/clinical-notes/${id}`);
        toast.add('Note supprimée', 'success');
        queryClient.invalidateQueries({ queryKey: ['clinical-notes', patientId] });
      } catch {
        toast.add('Impossible de supprimer la note', 'error');
      }
    }

    async function submitObservation() {
      observationSubmitting.value = true;
      try {
        await api.post(`/patients/${patientId.value}/episodes`, {
          ...observationForm.value,
          end_date: observationForm.value.end_date || undefined,
          transport_mean: observationForm.value.transport_mean || undefined,
          therapeutic_pathway: observationForm.value.therapeutic_pathway || undefined,
          provenance: observationForm.value.provenance || undefined,
        });
        toast.add('Observation médicale créée', 'success');
        queryClient.invalidateQueries({ queryKey: ['patient-episodes', patientId] });
        showObservationForm.value = false;
        observationPathwaySelect.value = '';
        observationProvenanceSelect.value = '';
        observationConsultationMotifSelect.value = '';
        observationDiagnosisSelect.value = '';
        observationForm.value = {
          type: 'CONSULTATION',
          transport_mean: '',
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
        };
      } catch {
        toast.add('Erreur lors de la création', 'error');
      } finally {
        observationSubmitting.value = false;
      }
    }

    const notesByDate = computed(() => {
      const list = notes.value ?? [];
      const byDate: Record<string, ClinicalNote[]> = {};
      list.forEach((n) => {
        const d = n.created_at ? new Date(n.created_at).toLocaleDateString('fr-FR') : '—';
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(n);
      });
      return Object.entries(byDate).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
    });

    function formatDate(iso?: string) {
      if (!iso) return '—';
      return new Date(iso).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }

    return () => (
      <div class={DOSSIER_PAGE_STACK}>
        <PatientFormPageHero
          title="Notes cliniques"
          description="Antécédents, allergies, historique des notes et paramètres vitaux"
        >
          {{
            icon: () => <Stethoscope class="h-7 w-7" strokeWidth={2.25} />,
          }}
        </PatientFormPageHero>

        {/* Nouvelle note — en haut pour être bien visible */}
        <Card class="overflow-hidden border-0 bg-linear-to-br from-primary/8 via-white to-white p-0 shadow-lg ring-1 ring-primary/25">
          <div class="border-b border-primary/15 bg-linear-to-r from-primary/10 to-transparent px-6 py-4">
            <h3 class="text-lg font-semibold text-slate-800">Nouvelle note</h3>
        </div>
          <div class="p-6">
          <textarea
            v-model={content.value}
            rows={3}
            placeholder="Saisir la note clinique..."
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button
            loading={isSubmitting.value || addNote.isPending.value}
            onClick={handleSubmit}
            disabled={!content.value.trim()}
            class="mt-3 rounded-xl"
            size="sm"
          >
            Enregistrer la note
          </Button>
          </div>
        </Card>

        <div class="grid gap-6 lg:grid-cols-3">
          {/* Column 1: Antécédents + Allergies */}
          <PatientAntecedentsAllergiesSection patientId={patientId.value} />

          {/* Column 2: Observation form + Historique notes */}
          <div class="space-y-6">
            <Card class="overflow-visible border-0 bg-linear-to-br from-teal-50/40 via-white to-white p-0 shadow-lg ring-1 ring-teal-200/70">
              <div class="border-b border-teal-100 bg-linear-to-r from-teal-100/50 to-transparent px-5 py-4 sm:px-6">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/25">
                      <ClipboardList class="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <div class="min-w-0">
                      <h3 class="text-lg font-semibold text-slate-900">Nouvelle observation médicale</h3>
                      <p class="text-xs text-slate-600">
                        Même champs et ordre que la page dédiée (provenance, motif codifié, ICD-11, parcours, notes).
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    class="shrink-0 rounded-xl border-teal-200 bg-white/90 text-teal-900 hover:bg-teal-50"
                    onClick={() => { showObservationForm.value = !showObservationForm.value; }}
                  >
                    {showObservationForm.value ? 'Masquer' : 'Afficher'}
                  </Button>
                </div>
              </div>
              <div class="p-0">
                {showObservationForm.value ? (
                  <form
                    onSubmit={(e: Event) => { e.preventDefault(); submitObservation(); }}
                    class="pb-0"
                  >
                    <div class="border-b border-slate-100 last:border-b-0">
                      <div class={obsSectionHeadSlate}>
                        <div class="flex items-start gap-3">
                          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200/80 text-slate-700">
                            <Building2 class="h-5 w-5" strokeWidth={2} />
                          </span>
                          <div class="min-w-0 flex-1">
                            <h3 class="text-sm font-semibold tracking-tight text-slate-900">Séjour et accès</h3>
                            <p class="mt-0.5 text-xs text-slate-500">
                              Type d’épisode, provenance, transport et dates.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div class={obsSectionBody}>
                        <div class="grid gap-5 sm:grid-cols-2">
                          <div class="sm:col-span-2">
                            <label class="mb-2 block text-sm font-medium text-slate-700">Provenance</label>
                            <p class="mb-2 text-xs text-slate-500">
                              Origine de la prise en charge ou mode d’orientation vers le service.
                            </p>
                            <SearchableSelect
                              modelValue={observationProvenanceSelect.value}
                              onUpdate:modelValue={(v: string) => {
                                observationProvenanceSelect.value = v;
                                if (v === PROVENANCE_AUTRE) observationForm.value.provenance = '';
                                else observationForm.value.provenance = v ?? '';
                              }}
                              options={provenanceOptions}
                              placeholder="Rechercher ou choisir une provenance…"
                              class="w-full"
                            />
                            {observationProvenanceSelect.value === PROVENANCE_AUTRE ? (
                              <textarea
                                v-model={observationForm.value.provenance}
                                rows={2}
                                maxlength={255}
                                placeholder="Préciser la provenance (max. 255 caractères)…"
                                class={`mt-2 ${obsField}`}
                              />
                            ) : null}
                          </div>
                          <div class="sm:col-span-2">
                            <label class="mb-2 block text-sm font-medium text-slate-700">Type</label>
                            <select v-model={observationForm.value.type} class={obsField}>
                              <option value="CONSULTATION">Consultation</option>
                              <option value="HOSPITALIZATION">Hospitalisation</option>
                              <option value="EMERGENCY">Urgence</option>
                            </select>
                          </div>
                          <div class="sm:col-span-2">
                            <label class="mb-2 block text-sm font-medium text-slate-700">Moyen de transport</label>
                            <select v-model={observationForm.value.transport_mean} class={obsField}>
                              <option value="">— Choisir —</option>
                              <option value="taxi">Taxi</option>
                              <option value="ambulance">Ambulance</option>
                              <option value="personnel">Moyen personnel</option>
                            </select>
                          </div>
                          <Input v-model={observationForm.value.start_date} label="Date d’entrée" type="date" />
                          <Input v-model={observationForm.value.end_date} label="Date de sortie" type="date" />
                        </div>
                      </div>
                    </div>

                    <div class="border-b border-slate-100 last:border-b-0">
                      <div class={obsSectionHeadPrimary}>
                        <div class="flex items-start gap-3">
                          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                            <PillBottle class="h-5 w-5" strokeWidth={2} />
                          </span>
                          <div class="min-w-0 flex-1">
                            <h3 class="text-sm font-semibold tracking-tight text-slate-900">Motif et anamnèse</h3>
                            <p class="mt-0.5 text-xs text-slate-500">
                              Motifs types neurologie ; détails dans l’histoire de la maladie si besoin.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div class={obsSectionBody}>
                        <div>
                          <label class="mb-2 block text-sm font-medium text-slate-700">Motif de consultation</label>
                          <SearchableSelect
                            modelValue={observationConsultationMotifSelect.value}
                            onUpdate:modelValue={(v: string) => {
                              observationConsultationMotifSelect.value = v;
                              if (v === MOTIF_AUTRE) observationForm.value.reason = '';
                              else observationForm.value.reason = v ?? '';
                            }}
                            options={consultationMotifOptions}
                            placeholder="Rechercher ou choisir un motif de consultation…"
                            class="w-full"
                          />
                          {observationConsultationMotifSelect.value === MOTIF_AUTRE ? (
                            <textarea
                              v-model={observationForm.value.reason}
                              rows={2}
                              maxlength={255}
                              placeholder="Préciser le motif (max. 255 caractères)…"
                              class={`mt-2 ${obsField}`}
                            />
                          ) : null}
                        </div>
                        <div>
                          <label class="mb-2 block text-sm font-medium text-slate-700">Histoire de la maladie</label>
                          <textarea v-model={observationForm.value.medical_history} rows={4} class={obsField} />
                        </div>
                        <div>
                          <label class="mb-2 block text-sm font-medium text-slate-700">Habitudes alimentaires</label>
                          <textarea v-model={observationForm.value.dietary_habits} rows={2} class={obsField} />
                        </div>
                      </div>
                    </div>

                    <div class="border-b border-slate-100 last:border-b-0">
                      <div class={obsSectionHeadTeal}>
                        <div class="flex items-start gap-3">
                          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100/90 text-teal-800">
                            <Signpost class="h-5 w-5" strokeWidth={2} />
                          </span>
                          <div class="min-w-0 flex-1">
                            <h3 class="text-sm font-semibold tracking-tight text-slate-900">Parcours thérapeutique</h3>
                            <p class="mt-0.5 text-xs text-slate-500">
                              Orientation prévue ou en cours (ambulatoire, bilan, hospitalisation, rééducation, avis…).
                            </p>
                          </div>
                        </div>
                      </div>
                      <div class={obsSectionBody}>
                        <div>
                          <label class="mb-2 block text-sm font-medium text-slate-700">Parcours envisagé</label>
                          <SearchableSelect
                            modelValue={observationPathwaySelect.value}
                            onUpdate:modelValue={(v: string) => {
                              observationPathwaySelect.value = v;
                              if (v === PATHWAY_AUTRE) observationForm.value.therapeutic_pathway = '';
                              else observationForm.value.therapeutic_pathway = v ?? '';
                            }}
                            options={therapeuticPathwayOptions}
                            placeholder="Rechercher ou choisir un parcours…"
                            class="w-full"
                          />
                          {observationPathwaySelect.value === PATHWAY_AUTRE ? (
                            <textarea
                              v-model={observationForm.value.therapeutic_pathway}
                              rows={2}
                              maxlength={255}
                              placeholder="Préciser le parcours (max. 255 caractères)…"
                              class={`mt-2 ${obsField}`}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div class="border-b border-slate-100 last:border-b-0">
                      <div class={obsSectionHeadViolet}>
                        <div class="flex items-start gap-3">
                          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100/90 text-violet-800">
                            <Stethoscope class="h-5 w-5" strokeWidth={2} />
                          </span>
                          <div class="min-w-0 flex-1">
                            <h3 class="text-sm font-semibold tracking-tight text-slate-900">Examen et notes</h3>
                            <p class="mt-0.5 text-xs text-slate-500">Sémiologie et remarques libres.</p>
                          </div>
                        </div>
                      </div>
                      <div class={obsSectionBody}>
                        <div>
                          <label class="mb-2 block text-sm font-medium text-slate-700">Examen clinique</label>
                          <textarea v-model={observationForm.value.clinical_exam} rows={4} class={obsField} />
                        </div>
                        <div>
                          <label class="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                          <textarea v-model={observationForm.value.notes} rows={3} class={obsField} />
                        </div>
                      </div>
                    </div>

                    <div class="border-b border-slate-100 last:border-b-0">
                      <div class={obsSectionHeadIndigo}>
                        <div class="flex items-start gap-3">
                          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100/90 text-indigo-800">
                            <Brain class="h-5 w-5" strokeWidth={2} />
                          </span>
                          <div class="min-w-0 flex-1">
                            <h3 class="text-sm font-semibold tracking-tight text-slate-900">
                              Diagnostic (ICD-11 neurologie)
                            </h3>
                            <p class="mt-0.5 text-xs text-slate-500">
                              Recherche par code ou libellé ; autre diagnostic possible.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div class={obsSectionBody}>
                        <SearchableSelect
                          modelValue={observationDiagnosisSelect.value}
                          onUpdate:modelValue={(v: string) => {
                            observationDiagnosisSelect.value = v;
                            if (v === '__autre__') observationForm.value.diagnosis = '';
                            else if (v) {
                              const item = icd11List.find((x) => x.code === v);
                              if (item) observationForm.value.diagnosis = `${item.code} — ${item.name}`;
                            } else observationForm.value.diagnosis = '';
                          }}
                          options={diagnosisOptions}
                          placeholder="Rechercher ou choisir un diagnostic…"
                          class="w-full"
                        />
                        {observationDiagnosisSelect.value === '__autre__' ? (
                          <textarea
                            v-model={observationForm.value.diagnosis}
                            rows={2}
                            placeholder="Préciser le diagnostic…"
                            class={obsField}
                          />
                        ) : null}
                      </div>
                    </div>

                    <div class="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                      <Button
                        type="submit"
                        loading={observationSubmitting.value}
                        class="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-base shadow-lg shadow-primary/30 sm:w-auto"
                      >
                        <CheckCircle2 class="h-5 w-5" strokeWidth={2.25} />
                        Créer l’observation médicale
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            </Card>

            <Card class="overflow-hidden border-0 bg-linear-to-br from-slate-50/80 via-white to-white p-0 shadow-lg ring-1 ring-slate-200/80">
              <div class="border-b border-slate-100 bg-linear-to-r from-slate-100/50 to-transparent px-6 py-4">
                <h3 class="text-lg font-semibold text-slate-800">Historique des notes cliniques</h3>
          </div>
          {isLoading.value ? (
                <div class="flex justify-center py-8">
              <Spinner />
            </div>
              ) : !notes.value?.length ? (
                <div class="py-8 text-center text-sm text-slate-500">Aucune note enregistrée.</div>
          ) : (
            <div class="divide-y divide-slate-100">
                  {notesByDate.value.map(([date, list]) => (
                    <details key={date} class="group">
                      <summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50/50">
                        <span>{date}</span>
                        <span class="text-slate-500">({list.length} note{list.length > 1 ? 's' : ''})</span>
                      </summary>
                      <div class="border-t border-slate-100 bg-slate-50/30">
                        {list.map((note) => (
                <div
                  key={note.id}
                            class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <p class="min-w-0 flex-1 whitespace-pre-wrap text-sm text-slate-800">{note.content}</p>
                            <div class="flex flex-col items-end gap-1 shrink-0">
                              <span class="text-xs text-slate-500">
                                Créé par {note.created_by?.full_name ?? '—'} le {formatDate(note.created_at)}
                              </span>
                              {note.updated_at && (
                                <span class="text-xs text-slate-400">
                                  Modifié par {note.updated_by?.full_name ?? '—'} le {formatDate(note.updated_at)}
                                </span>
                              )}
                              <div class="mt-1 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                                class="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => deleteNote(note.id)}
                  >
                    Supprimer
                  </Button>
                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
              ))}
            </div>
          )}
        </Card>
          </div>

          {/* Column 3: Paramètres vitaux */}
          <div>
            <Card class={DOSSIER_NEUTRAL_CARD}>
              <div class={DOSSIER_CARD_HEADER}>
                <h3 class="text-lg font-semibold text-slate-800">Paramètres vitaux</h3>
              </div>
              <div class={DOSSIER_CARD_BODY}>
              <div class="space-y-3">
                {vitalLabels.map(({ key, label, unit }) => (
                  <div key={key}>
                    <label class="mb-1 block text-xs font-medium text-slate-600">
                      {label} {unit && <span class="text-slate-400">({unit})</span>}
                    </label>
                    <input
                      type="text"
                      value={vitals.value[key] ?? ''}
                      onInput={(e) => {
                        vitals.value = { ...vitals.value, [key]: (e.target as HTMLInputElement).value };
                      }}
                      placeholder="—"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  },
});
