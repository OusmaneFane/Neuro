import PatientRecordHeader from '@/components/patient/PatientRecordHeader';
import {
  CLINICAL_ROLES,
  FINANCE_READ_ROLES,
  PRESCRIPTION_READ_ROLES,
  canAccessClinicalNav,
  hasRole,
} from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/types';
import { computed, defineComponent } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const dossierTabs = [
  { to: 'synthese-patient', label: 'Synthèse Patient' },
  { to: 'synthese-sejour', label: 'Synthèse séjour' },
  { to: 'synthese-generale', label: 'Synthèse générale' },
  { to: 'compte-rendu', label: 'Compte rendu médical' },
  { to: 'portail-medical', label: 'Portail médical' },
  { to: 'notes-cliniques', label: 'Notes cliniques' },
];

const mainTabs: { to: string; label: string; roles: readonly UserRole[] }[] = [
  { to: 'synthese-patient', label: 'Dossier', roles: CLINICAL_ROLES },
  { to: 'episodes', label: 'Observations médicales', roles: CLINICAL_ROLES },
  { to: 'examens-complementaires', label: 'Examens complémentaires', roles: CLINICAL_ROLES },
  { to: 'traitement', label: 'Traitement', roles: CLINICAL_ROLES },
  { to: 'evolution', label: 'Évolution', roles: CLINICAL_ROLES },
  { to: 'mode-sortie', label: 'Mode de sortie', roles: CLINICAL_ROLES },
  { to: 'documents', label: 'Documents', roles: CLINICAL_ROLES },
  { to: 'facturation', label: 'Facturation', roles: FINANCE_READ_ROLES },
  { to: 'ordonnances', label: 'Ordonnances', roles: PRESCRIPTION_READ_ROLES },
  { to: 'share', label: 'Partage', roles: CLINICAL_ROLES },
];

export default defineComponent({
  name: 'PatientDetailLayout',
  setup() {
    const auth = useAuthStore();
    const route = useRoute();
    const patientId = computed(() => route.params.id as string);
    const role = computed(() => auth.user?.role);

    const visibleMainTabs = computed(() =>
      mainTabs.filter((tab) => hasRole(role.value, tab.roles)),
    );

    const showDossierSubs = computed(() => canAccessClinicalNav(role.value));

    const isDossierActive = computed(() =>
      dossierTabs.some((t) => route.path.includes(t.to)),
    );
    const isEpisodesActive = computed(() => route.path.includes('episodes'));
    const isExamensActive = computed(() => route.path.includes('examens-complementaires'));
    const isTraitementActive = computed(() => route.path.includes('traitement'));
    const isEvolutionActive = computed(() => route.path.includes('evolution'));
    const isModeSortieActive = computed(() => route.path.includes('mode-sortie'));
    const isDocumentsActive = computed(() => route.path.includes('documents'));
    const isFacturationActive = computed(() => route.path.includes('facturation'));
    const isOrdonnancesActive = computed(() => route.path.includes('ordonnances'));
    const isShareActive = computed(() => route.path.includes('share'));

    function isTabActive(label: string): boolean {
      if (label === 'Dossier') return isDossierActive.value;
      if (label === 'Observations médicales') return isEpisodesActive.value;
      if (label === 'Examens complémentaires') return isExamensActive.value;
      if (label === 'Traitement') return isTraitementActive.value;
      if (label === 'Évolution') return isEvolutionActive.value;
      if (label === 'Mode de sortie') return isModeSortieActive.value;
      if (label === 'Documents') return isDocumentsActive.value;
      if (label === 'Facturation') return isFacturationActive.value;
      if (label === 'Ordonnances') return isOrdonnancesActive.value;
      return isShareActive.value;
    }

    return () => (
      <div class="space-y-6 sm:space-y-8">
        <RouterLink
          to="/hospital/patients"
          class="inline-flex items-center text-sm font-medium text-primary transition hover:opacity-90"
        >
          <span class="mr-1">←</span> Retour aux patients
        </RouterLink>
        {patientId.value && <PatientRecordHeader />}
        <nav class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div class="flex min-w-max flex-col gap-4 sm:min-w-0">
            <div class="flex min-w-max gap-1 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5 sm:min-w-0">
              {visibleMainTabs.value.map((tab) => {
                const isActive = isTabActive(tab.label);
                const path =
                  tab.label === 'Dossier'
                    ? `/hospital/patients/${patientId.value}/synthese-patient`
                    : tab.label === 'Examens complémentaires'
                      ? `/hospital/patients/${patientId.value}/examens-complementaires`
                      : `/hospital/patients/${patientId.value}/${tab.to}`;
                return (
                  <RouterLink
                    key={tab.label}
                    to={path}
                    class={[
                      'shrink-0 rounded-lg px-3 py-2.5 text-sm font-semibold transition sm:px-4',
                      isActive
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-600 hover:bg-white/50 hover:text-slate-800',
                    ]}
                  >
                    {tab.label}
                  </RouterLink>
                );
              })}
            </div>
            {showDossierSubs.value && isDossierActive.value && (
              <div class="flex min-w-max gap-1 rounded-xl border border-primary/20 bg-primary/5 p-1.5">
                {dossierTabs.map((tab) => {
                  const isSubActive = route.path.includes(tab.to);
                  const path = `/hospital/patients/${patientId.value}/${tab.to}`;
                  return (
                    <RouterLink
                      key={tab.to}
                      to={path}
                      class={[
                        'shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4',
                        isSubActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-slate-600 hover:bg-primary/10 hover:text-slate-800',
                      ]}
                    >
                      {tab.label}
                    </RouterLink>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
        <router-view />
      </div>
    );
  },
});
