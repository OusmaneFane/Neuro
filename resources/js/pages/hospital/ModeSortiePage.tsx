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
import { LogOut, Save } from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const modeSortieOptions = [
  'Retour domicile',
  'Centre rééducation',
  'Décharge',
  'Évasion',
  'Décès',
];

interface ComplementaryData {
  mode_sortie?: string;
}

export default defineComponent({
  name: 'ModeSortiePage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const patientId = computed(() => route.params.id as string);
    const modeSortie = ref('');
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
      modeSortie.value = val.mode_sortie ?? '';
    }, { immediate: true });

    async function save() {
      saving.value = true;
      try {
        await api.put(`/patients/${patientId.value}/complementary-data`, {
          mode_sortie: modeSortie.value || undefined,
        });
        toast.add('Mode de sortie enregistré', 'success');
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
          title="Mode de sortie"
          description="Mode de sortie du patient"
        >
          {{
            icon: () => <LogOut class="h-7 w-7" strokeWidth={2.25} />,
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
              <h3 class="text-lg font-semibold text-slate-800">Choix</h3>
            </div>
            <div class={DOSSIER_CARD_BODY}>
            <select
              v-model={modeSortie.value}
              class="w-full max-w-md rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">— Choisir —</option>
              {modeSortieOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            </div>
          </Card>
        )}
      </div>
    );
  },
});
