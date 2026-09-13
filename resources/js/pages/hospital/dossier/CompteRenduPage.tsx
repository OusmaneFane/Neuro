import PatientFormPageHero from '@/components/patient/PatientFormPageHero';
import {
  DOSSIER_CARD_BODY,
  DOSSIER_CARD_HEADER,
  DOSSIER_NEUTRAL_CARD,
  DOSSIER_PAGE_STACK,
} from '@/components/patient/dossierPageUi';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import { FileText, Save } from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

interface ComplementaryData {
  compte_rendu?: string;
}

export default defineComponent({
  name: 'CompteRenduPage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const patientId = computed(() => route.params.id as string);
    const compteRendu = ref('');
    const saving = ref(false);

    const { data, isLoading } = useQuery({
      queryKey: ['complementary-data', patientId],
      queryFn: async () => {
        const { data: res } = await api.get<ComplementaryData>(`/patients/${patientId.value}/complementary-data`);
        return res;
      },
    });

    watch(
      data,
      (val) => {
        if (val) compteRendu.value = val.compte_rendu ?? '';
      },
      { immediate: true }
    );

    async function save() {
      saving.value = true;
      try {
        await api.put(`/patients/${patientId.value}/complementary-data`, {
          compte_rendu: compteRendu.value || undefined,
        });
        toast.add('Compte rendu enregistré', 'success');
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
          title="Compte rendu médical"
          description="Résumé global du séjour, de l'entrée du patient jusqu'à sa sortie. Saisi par le médecin."
        >
          {{
            icon: () => <FileText class="h-7 w-7" strokeWidth={2.25} />,
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
              <h3 class="text-lg font-semibold text-slate-800">Rédaction</h3>
            </div>
            <div class={DOSSIER_CARD_BODY}>
            <label class="mb-3 block text-sm font-medium text-slate-700">
              Rédigez le compte rendu (gras, listes, titres…)
            </label>
            <RichTextEditor
              modelValue={compteRendu.value}
              onUpdate:modelValue={(v: string) => { compteRendu.value = v; }}
              placeholder="Ex. : Patient admis le … pour … Motif d’hospitalisation : … Bilan réalisé : … Traitement : … Évolution : … Sortie le …"
              minHeight="320px"
            />
            </div>
          </Card>
        )}
      </div>
    );
  },
});
