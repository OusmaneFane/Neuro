import PatientFormPageHero from '@/components/patient/PatientFormPageHero';
import { DOSSIER_PAGE_STACK } from '@/components/patient/dossierPageUi';
import Card from '@/components/ui/card';
import { api } from '@/lib/api';
import { LayoutGrid } from 'lucide-vue-next';
import type { Patient } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, computed } from 'vue';
import { useRoute } from 'vue-router';
import { RouterLink } from 'vue-router';

const quickLinks = [
  {
    to: 'episodes',
    label: 'Observations médicales',
    desc: 'Consulter les observations médicales',
    icon: (
      <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    color: 'from-primary to-blue-600',
    bg: 'bg-teal-100',
  },
  {
    to: 'documents',
    label: 'Documents',
    desc: 'Téléverser et consulter les documents médicaux',
    icon: (
      <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'from-slate-600 to-slate-700',
    bg: 'bg-slate-100',
  },
  {
    to: 'notes-cliniques',
    label: 'Notes cliniques',
    desc: 'Saisir et consulter les notes cliniques',
    icon: (
      <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-100',
  },
  {
    to: 'share',
    label: 'Partage',
    desc: 'Partager le dossier de manière sécurisée',
    icon: (
      <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-100',
  },
];

export default defineComponent({
  name: 'PortailMedicalPage',
  setup() {
    const route = useRoute();
    const id = computed(() => route.params.id as string);

    const { data: patient } = useQuery({
      queryKey: ['patient', id],
      queryFn: async () => {
        const { data } = await api.get<Patient>(`/patients/${id.value}`);
        return data;
      },
    });

    return () => (
      <div class={DOSSIER_PAGE_STACK}>
        <PatientFormPageHero
          title="Portail médical"
          description="Accès rapide aux différentes sections du dossier patient"
        >
          {{
            icon: () => <LayoutGrid class="h-7 w-7" strokeWidth={2.25} />,
          }}
        </PatientFormPageHero>
        {patient.value && (
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <RouterLink
                key={link.to}
                to={`/hospital/patients/${id.value}/${link.to}`}
                class="group block"
              >
                <Card
                  class={[
                    'h-full overflow-hidden border-0 p-6 shadow-md transition-all duration-200',
                    'hover:shadow-xl hover:-translate-y-0.5',
                    `bg-linear-to-br ${link.color} text-white`,
                  ]}
                >
                  <span
                    class={[
                      'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
                      'bg-white/20 text-white transition group-hover:scale-110',
                    ]}
                  >
                    {link.icon}
                  </span>
                  <h3 class="text-lg font-semibold">{link.label}</h3>
                  <p class="mt-2 text-sm text-white/90">{link.desc}</p>
                  <span class="mt-4 inline-flex items-center text-sm font-medium text-white/90 group-hover:underline">
                    Accéder
                    <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Card>
              </RouterLink>
            ))}
          </div>
        )}
      </div>
    );
  },
});
