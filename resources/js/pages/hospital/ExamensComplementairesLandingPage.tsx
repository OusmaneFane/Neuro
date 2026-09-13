import PatientFormPageHero from '@/components/patient/PatientFormPageHero';
import { DOSSIER_PAGE_STACK } from '@/components/patient/dossierPageUi';
import Card from '@/components/ui/card';
import { ClipboardList } from 'lucide-vue-next';
import { defineComponent } from 'vue';
import { RouterLink } from 'vue-router';

export default defineComponent({
  name: 'ExamensComplementairesLandingPage',
  setup() {
    return () => (
      <div class={DOSSIER_PAGE_STACK}>
        <PatientFormPageHero
          title="Examens complémentaires"
          description="Imagerie, explorations fonctionnelles, biologie, traitement et évolution"
        >
          {{
            icon: () => <ClipboardList class="h-7 w-7" strokeWidth={2.25} />,
          }}
        </PatientFormPageHero>
        <Card class="overflow-hidden border-0 bg-linear-to-br from-slate-50/80 via-white to-white p-0 shadow-lg ring-1 ring-slate-200/80">
          <div class="border-b border-slate-100 bg-linear-to-r from-slate-100/50 to-transparent px-6 py-4 text-left">
            <h2 class="text-lg font-semibold text-slate-800">Accès au module</h2>
          </div>
          <div class="p-8 text-center">
            <p class="text-slate-600">
              Veuillez ouvrir un dossier patient pour accéder aux examens complémentaires.
            </p>
            <RouterLink
              to="/hospital/patients"
              class="mt-4 inline-block font-medium text-primary hover:underline"
            >
              Voir la liste des patients
            </RouterLink>
          </div>
        </Card>
      </div>
    );
  },
});
