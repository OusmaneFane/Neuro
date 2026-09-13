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
import Spinner from '@/components/ui/spinner';
import { Activity, Save } from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const evolutionOptions = ['Favorable', 'Chronique', 'Décès'] as const;

interface ComplementaryData {
  evolution?: string;
  evolution_justification?: string;
}

export default defineComponent({
  name: 'EvolutionPage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const patientId = computed(() => route.params.id as string);
    const evolution = ref<'Favorable' | 'Chronique' | 'Décès' | ''>('');
    const evolutionJustification = ref('');
    const saving = ref(false);

    const { data, isLoading } = useQuery({
      queryKey: ['complementary-data', patientId],
      queryFn: async () => {
        const { data: res } = await api.get<ComplementaryData>(`/patients/${patientId.value}/complementary-data`);
        return res;
      },
    });

    watch(data, (val) => {
      if (!val) return;
      evolution.value = (evolutionOptions.includes((val.evolution ?? '') as typeof evolutionOptions[number]))
        ? (val.evolution as typeof evolutionOptions[number])
        : '';
      evolutionJustification.value = val.evolution_justification ?? '';
    }, { immediate: true });

    async function save() {
      saving.value = true;
      try {
        await api.put(`/patients/${patientId.value}/complementary-data`, {
          evolution: evolution.value || undefined,
          evolution_justification: evolutionJustification.value || undefined,
        });
        toast.add('Évolution enregistrée', 'success');
        queryClient.invalidateQueries({ queryKey: ['complementary-data', patientId] });
      } catch {
        toast.add('Erreur lors de l\'enregistrement', 'error');
      } finally {
        saving.value = false;
      }
    }

    return () => (
      <div class={DOSSIER_PAGE_STACK}>
        <PatientFormPageHero
          title="Évolution"
          description="Évolution du patient, justification, antécédents et allergies (dossier complémentaire)"
        >
          {{
            icon: () => <Activity class="h-7 w-7" strokeWidth={2.25} />,
            actions: () => (
              <Button
                onClick={save}
                loading={saving.value}
                class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-base shadow-lg shadow-primary/30"
              >
                <Save class="h-5 w-5" strokeWidth={2.25} />
                Enregistrer
              </Button>
            ),
          }}
        </PatientFormPageHero>

        <div class="grid gap-6 lg:grid-cols-2">
          {isLoading.value ? (
            <div class="flex min-h-50 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 lg:min-h-70">
              <Spinner />
            </div>
          ) : (
            <Card class={DOSSIER_NEUTRAL_CARD}>
              <div class={DOSSIER_CARD_HEADER}>
                <h3 class="text-lg font-semibold text-slate-800">Évolution</h3>
              </div>
              <div class={DOSSIER_CARD_BODY}>
                <div class="space-y-4">
                  <div class="flex flex-wrap gap-4">
                    {evolutionOptions.map((opt) => (
                      <label key={opt} class="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="evolution"
                          checked={evolution.value === opt}
                          onChange={() => { evolution.value = opt; }}
                          class="border-slate-300 text-primary focus:ring-primary"
                        />
                        <span class="text-sm font-medium text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-700">Justification</label>
                    <textarea
                      v-model={evolutionJustification.value}
                      rows={4}
                      placeholder="Justification..."
                      class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}
          <PatientAntecedentsAllergiesSection patientId={patientId.value} />
        </div>
      </div>
    );
  },
});
