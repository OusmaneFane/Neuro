import {
  ADMIN_ROLES,
  CLINICAL_ROLES,
  CLINICAL_WRITE_ROLES,
  FINANCE_READ_ROLES,
  PATIENT_ACCESS_ROLES,
  PHARMACY_ROLES,
  PRESCRIPTION_READ_ROLES,
  canAccessClinicalNav,
  canAccessFinance,
  canAccessPharmacy,
} from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';
import { HOSPITAL_STAFF_ROLES, type UserRole } from '@/types';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.tsx'), meta: { guest: true } },
    { path: '/share/:token', name: 'share-view', component: () => import('@/pages/ShareViewPage.tsx'), meta: { public: true } },
    {
      path: '/hospital',
      component: () => import('@/layouts/AppLayout.tsx'),
      meta: { roles: HOSPITAL_STAFF_ROLES },
      children: [
        { path: '', redirect: '/hospital/dashboard' },
        { path: 'dashboard', name: 'hospital-dashboard', component: () => import('@/pages/hospital/DashboardPage.tsx') },
        { path: 'finance', redirect: '/hospital/finance/dashboard' },
        { path: 'finance/dashboard', name: 'hospital-finance-dashboard', component: () => import('@/pages/hospital/finance/FinanceDashboardPage.tsx'), meta: { roles: FINANCE_READ_ROLES } },
        { path: 'finance/invoices', name: 'hospital-finance-invoices', component: () => import('@/pages/hospital/finance/InvoicesListPage.tsx'), meta: { roles: FINANCE_READ_ROLES } },
        { path: 'finance/invoices/new', name: 'hospital-finance-invoice-new', component: () => import('@/pages/hospital/finance/InvoiceFormPage.tsx'), meta: { roles: FINANCE_READ_ROLES } },
        { path: 'finance/invoices/:id', name: 'hospital-finance-invoice-detail', component: () => import('@/pages/hospital/finance/InvoiceDetailPage.tsx'), meta: { roles: FINANCE_READ_ROLES } },
        { path: 'finance/cash-register', name: 'hospital-finance-cash-register', component: () => import('@/pages/hospital/finance/CashRegisterPage.tsx'), meta: { roles: FINANCE_READ_ROLES } },
        { path: 'finance/claims', name: 'hospital-finance-claims', component: () => import('@/pages/hospital/finance/ClaimsListPage.tsx'), meta: { roles: FINANCE_READ_ROLES } },
        { path: 'finance/claims/:id', name: 'hospital-finance-claim-detail', component: () => import('@/pages/hospital/finance/ClaimDetailPage.tsx'), meta: { roles: FINANCE_READ_ROLES } },
        { path: 'finance/tariffs', name: 'hospital-finance-tariffs', component: () => import('@/pages/hospital/finance/TariffsPage.tsx'), meta: { roles: FINANCE_READ_ROLES } },
        { path: 'finance/analytical', name: 'hospital-finance-analytical', component: () => import('@/pages/hospital/finance/AnalyticalReportPage.tsx'), meta: { roles: FINANCE_READ_ROLES } },
        { path: 'pharmacy', redirect: '/hospital/pharmacy/dashboard' },
        { path: 'pharmacy/dashboard', name: 'hospital-pharmacy-dashboard', component: () => import('@/pages/hospital/pharmacy/PharmacyDashboardPage.tsx'), meta: { roles: PHARMACY_ROLES } },
        { path: 'pharmacy/products', name: 'hospital-pharmacy-products', component: () => import('@/pages/hospital/pharmacy/ProductsPage.tsx'), meta: { roles: PHARMACY_ROLES } },
        { path: 'pharmacy/stock', name: 'hospital-pharmacy-stock', component: () => import('@/pages/hospital/pharmacy/StockLotsPage.tsx'), meta: { roles: PHARMACY_ROLES } },
        { path: 'pharmacy/movements', name: 'hospital-pharmacy-movements', component: () => import('@/pages/hospital/pharmacy/StockMovementsPage.tsx'), meta: { roles: PHARMACY_ROLES } },
        { path: 'pharmacy/alerts', name: 'hospital-pharmacy-alerts', component: () => import('@/pages/hospital/pharmacy/StockAlertsPage.tsx'), meta: { roles: PHARMACY_ROLES } },
        { path: 'pharmacy/purchase-orders', name: 'hospital-pharmacy-purchase-orders', component: () => import('@/pages/hospital/pharmacy/PurchaseOrdersPage.tsx'), meta: { roles: PHARMACY_ROLES } },
        { path: 'pharmacy/inventory', name: 'hospital-pharmacy-inventory', component: () => import('@/pages/hospital/pharmacy/InventoryCountPage.tsx'), meta: { roles: PHARMACY_ROLES } },
        { path: 'pharmacy/dispensations', name: 'hospital-pharmacy-dispensations', component: () => import('@/pages/hospital/pharmacy/DispensationsPage.tsx'), meta: { roles: PHARMACY_ROLES } },
        { path: 'episodes', name: 'hospital-episodes', component: () => import('@/pages/hospital/EpisodesListPage.tsx'), meta: { roles: CLINICAL_ROLES } },
        { path: 'examens-complementaires', name: 'hospital-examens-complementaires-index', component: () => import('@/pages/hospital/ExamensComplementairesLandingPage.tsx'), meta: { roles: CLINICAL_ROLES } },
        { path: 'documents', name: 'hospital-documents-recent', component: () => import('@/pages/hospital/DocumentsRecentPage.tsx'), meta: { roles: CLINICAL_ROLES } },
        { path: 'cartes', name: 'hospital-cartes', component: () => import('@/pages/hospital/PatientCardsPage.tsx'), meta: { roles: CLINICAL_ROLES } },
        { path: 'personnel', name: 'hospital-personnel', component: () => import('@/pages/hospital/PersonnelPage.tsx'), meta: { roles: ADMIN_ROLES } },
        { path: 'utilisateurs', name: 'hospital-utilisateurs', component: () => import('@/pages/hospital/UsersManagementPage.tsx'), meta: { roles: ADMIN_ROLES } },
        { path: 'settings', name: 'hospital-settings', component: () => import('@/pages/hospital/SettingsPage.tsx') },
        { path: 'patients', name: 'hospital-patients', component: () => import('@/pages/hospital/PatientsListPage.tsx'), meta: { roles: PATIENT_ACCESS_ROLES } },
        { path: 'patients/new', name: 'hospital-patient-new', component: () => import('@/pages/hospital/PatientFormPage.tsx'), meta: { roles: CLINICAL_WRITE_ROLES } },
        {
          path: 'patients/:id',
          component: () => import('@/layouts/PatientDetailLayout.tsx'),
          meta: { roles: PATIENT_ACCESS_ROLES },
          children: [
            {
              path: '',
              redirect: () => {
                const role = useAuthStore().user?.role;
                if (canAccessClinicalNav(role)) return { name: 'hospital-dossier-synthese-patient' };
                if (canAccessFinance(role)) return { name: 'hospital-patient-facturation' };
                if (canAccessPharmacy(role)) return { name: 'hospital-patient-ordonnances' };
                return { name: 'hospital-dashboard' };
              },
            },
            { path: 'synthese-patient', name: 'hospital-dossier-synthese-patient', component: () => import('@/pages/hospital/dossier/SynthesePatientPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'synthese-sejour', name: 'hospital-dossier-synthese-sejour', component: () => import('@/pages/hospital/dossier/SyntheseSejourPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'synthese-generale', name: 'hospital-dossier-synthese-generale', component: () => import('@/pages/hospital/dossier/SyntheseGeneralePage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'portail-medical', name: 'hospital-dossier-portail', component: () => import('@/pages/hospital/dossier/PortailMedicalPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'notes-cliniques', name: 'hospital-dossier-notes', component: () => import('@/pages/hospital/dossier/NotesCliniquesPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'compte-rendu', name: 'hospital-dossier-compte-rendu', component: () => import('@/pages/hospital/dossier/CompteRenduPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'episodes', name: 'hospital-patient-episodes', component: () => import('@/pages/hospital/PatientEpisodesListPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'episodes/new', name: 'hospital-episode-new', component: () => import('@/pages/hospital/EpisodeFormPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'examens-complementaires', name: 'hospital-examens-complementaires', component: () => import('@/pages/hospital/ExamensComplementairesPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'traitement', name: 'hospital-traitement', component: () => import('@/pages/hospital/TraitementPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'evolution', name: 'hospital-evolution', component: () => import('@/pages/hospital/EvolutionPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'mode-sortie', name: 'hospital-mode-sortie', component: () => import('@/pages/hospital/ModeSortiePage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'documents', name: 'hospital-documents', component: () => import('@/pages/hospital/DocumentsPage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'share', name: 'hospital-share', component: () => import('@/pages/hospital/SharePage.tsx'), meta: { roles: CLINICAL_ROLES } },
            { path: 'facturation', name: 'hospital-patient-facturation', component: () => import('@/pages/hospital/pharmacy/PatientBillingPage.tsx'), meta: { roles: FINANCE_READ_ROLES } },
            { path: 'ordonnances', name: 'hospital-patient-ordonnances', component: () => import('@/pages/hospital/pharmacy/PatientPrescriptionsPage.tsx'), meta: { roles: PRESCRIPTION_READ_ROLES } },
          ],
        },
      ],
    },
    {
      path: '/patient',
      component: () => import('@/layouts/AppLayout.tsx'),
      meta: { roles: ['PATIENT'] },
      children: [
        { path: '', redirect: '/patient/dashboard' },
        { path: 'dashboard', name: 'patient-dashboard', component: () => import('@/pages/patient/DashboardPage.tsx') },
        { path: 'records', name: 'patient-records', component: () => import('@/pages/patient/RecordsPage.tsx') },
        { path: 'documents', name: 'patient-documents', component: () => import('@/pages/patient/DocumentsPage.tsx') },
        { path: 'share', name: 'patient-share', component: () => import('@/pages/patient/SharePage.tsx') },
      ],
    },
    { path: '/', redirect: () => ({ name: 'login' }) },
  ],
});

function matchedRoles(to: { matched: { meta: { roles?: UserRole[] } }[] }): UserRole[] | undefined {
  // Deepest route meta.roles wins (child overrides parent).
  for (let i = to.matched.length - 1; i >= 0; i--) {
    const roles = to.matched[i].meta.roles;
    if (roles?.length) return roles;
  }
  return undefined;
}

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  if (to.meta.public) {
    return next();
  }

  if (to.meta.guest && auth.isAuthenticated) {
    if (!auth.user) {
      try {
        await auth.fetchUser();
      } catch {
        auth.abandonSession();
        return next();
      }
    }
    if (auth.isHospitalStaff) return next('/hospital/dashboard');
    if (auth.isPatient) return next('/patient/dashboard');
    return next();
  }

  if (!to.meta.guest && !auth.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchUser();
    } catch {
      auth.abandonSession();
      if (!to.meta.guest) {
        return next({ name: 'login', query: { redirect: to.fullPath } });
      }
    }
  }

  const roles = matchedRoles(to);
  if (roles?.length && auth.user && !roles.includes(auth.user.role)) {
    // Finance/pharmacy staff landing on clinical dossier → redirect to a useful tab
    if (auth.user.role && FINANCE_READ_ROLES.includes(auth.user.role) && to.path.includes('/patients/')) {
      const id = to.params.id;
      if (id) return next(`/hospital/patients/${id}/facturation`);
    }
    if (auth.user.role && PHARMACY_ROLES.includes(auth.user.role) && to.path.includes('/patients/')) {
      const id = to.params.id;
      if (id) return next(`/hospital/patients/${id}/ordonnances`);
    }
    if (auth.isHospitalStaff) return next('/hospital/dashboard');
    if (auth.isPatient) return next('/patient/dashboard');
    return next('/login');
  }

  next();
});

export default router;
