import PatientFormPageHero from '@/components/patient/PatientFormPageHero';
import {
  DOSSIER_CARD_BODY,
  DOSSIER_CARD_HEADER,
  DOSSIER_NEUTRAL_CARD,
  DOSSIER_PAGE_STACK,
} from '@/components/patient/dossierPageUi';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import { PillBottle, Save } from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

interface ComplementaryData {
  traitement_entree?: string;
  traitement_sortie?: string;
}

export default defineComponent({
  name: 'TraitementPage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const patientId = computed(() => route.params.id as string);
    const traitementEntree = ref('');
    const traitementSortie = ref('');
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
      traitementEntree.value = val.traitement_entree ?? '';
      traitementSortie.value = val.traitement_sortie ?? '';
    }, { immediate: true });

    async function save() {
      saving.value = true;
      try {
        await api.put(`/patients/${patientId.value}/complementary-data`, {
          traitement_entree: traitementEntree.value,
          traitement_sortie: traitementSortie.value,
        });
        toast.add('Traitement enregistré', 'success');
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
          title="Traitement"
          description="Traitement à l'entrée et à la sortie"
        >
          {{
            icon: () => <PillBottle class="h-7 w-7" strokeWidth={2.25} />,
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

        {isLoading.value ? (
          <div class="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <Card class={DOSSIER_NEUTRAL_CARD}>
            <div class={DOSSIER_CARD_HEADER}>
              <h3 class="text-lg font-semibold text-slate-800">Saisie</h3>
            </div>
            <div class={DOSSIER_CARD_BODY}>
            <div class="grid gap-6 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Entrée</label>
                <textarea
                  v-model={traitementEntree.value}
                  rows={6}
                  placeholder="Traitement à l'entrée..."
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Sortie</label>
                <textarea
                  v-model={traitementSortie.value}
                  rows={6}
                  placeholder="Traitement à la sortie..."
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            </div>
          </Card>
        )}
      </div>
    );
  },
});
