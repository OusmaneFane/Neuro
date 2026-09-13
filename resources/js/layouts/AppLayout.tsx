import {
  ADMIN_ROLES,
  CLINICAL_ROLES,
  FINANCE_READ_ROLES,
  PATIENT_ACCESS_ROLES,
  PHARMACY_ROLES,
} from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';
import { HOSPITAL_STAFF_ROLES } from '@/types';
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

const hospitalNav = [
  { to: '/hospital/dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard', group: 'principal', roles: HOSPITAL_STAFF_ROLES },
  { to: '/hospital/patients', label: 'Patients', icon: 'Users', group: 'principal', roles: PATIENT_ACCESS_ROLES },
  { to: '/hospital/episodes', label: 'Observations médicales', icon: 'Activity', group: 'principal', roles: CLINICAL_ROLES },
  { to: '/hospital/examens-complementaires', label: 'Examens complémentaires', icon: 'ClipboardList', group: 'principal', roles: CLINICAL_ROLES },
  { to: '/hospital/documents', label: 'Documents', icon: 'FileText', group: 'principal', roles: CLINICAL_ROLES },
  { to: '/hospital/cartes', label: 'Cartes', icon: 'CreditCard', group: 'principal', roles: CLINICAL_ROLES },
  { to: '/hospital/finance/dashboard', label: 'Finances', icon: 'Wallet', group: 'finance', roles: FINANCE_READ_ROLES },
  { to: '/hospital/finance/invoices', label: 'Factures', icon: 'Receipt', group: 'finance', roles: FINANCE_READ_ROLES },
  { to: '/hospital/finance/cash-register', label: 'Caisse', icon: 'CashRegister', group: 'finance', roles: FINANCE_READ_ROLES },
  { to: '/hospital/finance/claims', label: 'Tiers payant', icon: 'Shield', group: 'finance', roles: FINANCE_READ_ROLES },
  { to: '/hospital/finance/analytical', label: 'Analytique', icon: 'PieChart', group: 'finance', roles: FINANCE_READ_ROLES },
  { to: '/hospital/finance/tariffs', label: 'Tarifs', icon: 'Tags', group: 'finance', roles: FINANCE_READ_ROLES },
  { to: '/hospital/pharmacy/dashboard', label: 'Pharmacie', icon: 'Pill', group: 'pharmacy', roles: PHARMACY_ROLES },
  { to: '/hospital/pharmacy/products', label: 'Catalogue', icon: 'Package', group: 'pharmacy', roles: PHARMACY_ROLES },
  { to: '/hospital/pharmacy/stock', label: 'Stock', icon: 'Warehouse', group: 'pharmacy', roles: PHARMACY_ROLES },
  { to: '/hospital/pharmacy/movements', label: 'Mouvements', icon: 'ArrowLeftRight', group: 'pharmacy', roles: PHARMACY_ROLES },
  { to: '/hospital/pharmacy/alerts', label: 'Alertes stock', icon: 'ClipboardCheck', group: 'pharmacy', roles: PHARMACY_ROLES },
  { to: '/hospital/pharmacy/purchase-orders', label: 'Approvisionnements', icon: 'Truck', group: 'pharmacy', roles: PHARMACY_ROLES },
  { to: '/hospital/pharmacy/inventory', label: 'Inventaires', icon: 'ClipboardCheck', group: 'pharmacy', roles: PHARMACY_ROLES },
  { to: '/hospital/pharmacy/dispensations', label: 'Délivrances', icon: 'HandCoins', group: 'pharmacy', roles: PHARMACY_ROLES },
  { to: '/hospital/personnel', label: 'Personnel', icon: 'UserCog', roles: ADMIN_ROLES, group: 'admin' },
  { to: '/hospital/utilisateurs', label: 'Utilisateurs', icon: 'Users2', roles: ADMIN_ROLES, group: 'admin' },
  { to: '/hospital/settings', label: 'Paramètres', icon: 'Settings', roles: HOSPITAL_STAFF_ROLES, group: 'admin' },
];

const patientNav = [
  { to: '/patient/dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard' },
  { to: '/patient/records', label: 'Dossier médical', icon: 'FileText' },
  { to: '/patient/documents', label: 'Documents', icon: 'File' },
  { to: '/patient/share', label: 'Partage', icon: 'Share2' },
];

function Icon({ name }: { name: string }) {
  const icons: Record<string, () => JSX.Element> = {
    LayoutDashboard: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    Users: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    FileText: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    File: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    Share2: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    Activity: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    ClipboardList: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    CreditCard: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    UserCog: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Users2: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    Settings: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    Wallet: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    Receipt: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l2 2 4-4m5 2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12l3-2 3 2 3-2 3 2 3-2z" />
      </svg>
    ),
    CashRegister: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    Shield: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    PieChart: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    Tags: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5a1 1 0 01.707.293l7 7a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-7-7A1 1 0 013 9V4a1 1 0 011-1h3z" />
      </svg>
    ),
    Pill: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 13.5l3-3m-6.364 6.364a4.5 4.5 0 016.364-6.364l4.95 4.95a4.5 4.5 0 11-6.364 6.364l-4.95-4.95z" />
      </svg>
    ),
    Package: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    Warehouse: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
      </svg>
    ),
    ArrowLeftRight: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    ),
    Truck: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h4l3 3v-5h-7v2z" />
      </svg>
    ),
    ClipboardCheck: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    HandCoins: () => (
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
  };
  const C = icons[name] ?? (() => null);
  return <C />;
}

export default defineComponent({
  name: 'AppLayout',
  setup() {
    const auth = useAuthStore();
    const route = useRoute();
    const router = useRouter();
    const sidebarOpen = ref(true);
    const mobileMenuOpen = ref(false);
    const searchQuery = ref('');
    const isLarge = ref(true);

    const nav = computed(() => {
      const items = auth.isHospitalStaff ? hospitalNav : patientNav;
      return items.filter((item) => {
        const roles = (item as { roles?: readonly string[] }).roles;
        if (!roles) return true;
        return auth.user && roles.includes(auth.user.role);
      });
    });

    const hospitalPrincipal = computed(() => nav.value.filter((i) => (i as { group?: string }).group === 'principal'));
    const hospitalFinance = computed(() => nav.value.filter((i) => (i as { group?: string }).group === 'finance'));
    const hospitalPharmacy = computed(() => nav.value.filter((i) => (i as { group?: string }).group === 'pharmacy'));
    const hospitalAdmin = computed(() => nav.value.filter((i) => (i as { group?: string }).group === 'admin'));

    function updateWidth() {
      isLarge.value = window.innerWidth >= 1024;
      if (isLarge.value) mobileMenuOpen.value = false;
    }

    onMounted(() => {
      updateWidth();
      window.addEventListener('resize', updateWidth);
    });
    onUnmounted(() => {
      window.removeEventListener('resize', updateWidth);
    });

    function closeMobileMenu() {
      mobileMenuOpen.value = false;
    }

    function handleSearch(e: Event) {
      e.preventDefault();
      if (auth.isHospitalStaff && searchQuery.value.trim()) {
        router.push({ path: '/hospital/patients', query: { query: searchQuery.value.trim() } });
        searchQuery.value = '';
        closeMobileMenu();
      }
    }

    function NavItem({ item, onClick }: { item: typeof hospitalNav[0]; onClick?: () => void }) {
      const isActive = route.path.startsWith(item.to);
      return (
        <RouterLink
          to={item.to}
          onClick={onClick}
          class={[
            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive
              ? 'bg-[#7CFF6A] text-[#061018]'
              : 'text-slate-300 hover:bg-white/10 hover:text-white',
          ]}
        >
          <span class={isActive ? 'text-[#061018]' : 'text-slate-400 group-hover:text-[#7CFF6A]'}>
            <Icon name={item.icon} />
          </span>
          {(sidebarOpen.value || !isLarge.value) && <span class="truncate">{item.label}</span>}
        </RouterLink>
      );
    }

    function NavGroup({ title, items, onNavClick }: { title: string; items: typeof hospitalNav; onNavClick?: () => void }) {
      if (!items.length) return null;
      return (
        <div class="space-y-1">
          {(sidebarOpen.value || !isLarge.value) && (
            <p class="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7CFF6A]/70">
              {title}
            </p>
          )}
          {items.map((item) => (
            <NavItem key={item.to} item={item} onClick={onNavClick} />
          ))}
        </div>
      );
    }

    const SidebarContent = (onNavClick?: () => void) => (
      <>
        <div class="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-3">
          <RouterLink
            to={auth.isHospitalStaff ? '/hospital/dashboard' : '/patient/dashboard'}
            onClick={onNavClick}
            class={['flex min-w-0 items-center gap-2.5', !(sidebarOpen.value || !isLarge.value) && 'mx-auto']}
          >
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm shadow-black/20">
              <img
                src="/DoniSante-icon-clear.png"
                alt="DoniSanté"
                class="h-9 w-9 object-contain"
              />
            </div>
            {(sidebarOpen.value || !isLarge.value) && (
              <div class="min-w-0">
                <span class="block truncate font-login-display text-base font-bold tracking-tight">
                  <span class="text-white">Doni</span>
                  <span class="text-[#7CFF6A]">Santé</span>
                </span>
                <span class="block truncate text-[11px] text-slate-400">Dossier médical</span>
              </div>
            )}
          </RouterLink>
          {isLarge.value ? (
            <button
              type="button"
              onClick={() => { sidebarOpen.value = !sidebarOpen.value; }}
              class="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label={sidebarOpen.value ? 'Réduire' : 'Agrandir'}
            >
              <svg class={['h-5 w-5 transition-transform', !sidebarOpen.value && 'rotate-180']} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <button type="button" onClick={closeMobileMenu} class="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Fermer">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <nav class="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {auth.isHospitalStaff ? (
            <>
              <NavGroup title="Principal" items={hospitalPrincipal.value} onNavClick={onNavClick} />
              <NavGroup title="Finances" items={hospitalFinance.value} onNavClick={onNavClick} />
              <NavGroup title="Pharmacie" items={hospitalPharmacy.value} onNavClick={onNavClick} />
              <NavGroup title="Administration" items={hospitalAdmin.value} onNavClick={onNavClick} />
            </>
          ) : (
            <div class="space-y-1">
              {nav.value.map((item) => <NavItem key={item.to} item={item} onClick={onNavClick} />)}
            </div>
          )}
        </nav>
        <div class="border-t border-white/10 p-3">
          <div class={['flex items-center gap-3 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10', (sidebarOpen.value || !isLarge.value) ? '' : 'justify-center']}>
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7CFF6A]/15 font-semibold text-[#7CFF6A]">
              {auth.user?.full_name?.charAt(0) ?? '?'}
            </div>
            {(sidebarOpen.value || !isLarge.value) && (
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-white">{auth.user?.full_name}</p>
                <p class="truncate text-xs text-slate-400">{auth.user?.role}</p>
              </div>
            )}
          </div>
        </div>
      </>
    );

    return () => (
      <div class="flex h-screen overflow-hidden bg-slate-100">
        {/* Desktop sidebar */}
        <aside
          class={[
            'hidden flex-col bg-[#1a3352] transition-all duration-300 lg:flex',
            sidebarOpen.value ? 'w-64' : 'w-[72px]',
          ]}
        >
          {SidebarContent()}
        </aside>

        {/* Mobile overlay */}
        {mobileMenuOpen.value && (
          <div
            class="fixed inset-0 z-40 bg-[#1a3352]/55 backdrop-blur-sm lg:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar drawer */}
        <aside
          class={[
            'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#1a3352] shadow-2xl transition-transform duration-300 lg:hidden',
            mobileMenuOpen.value ? 'translate-x-0' : '-translate-x-full',
          ]}
        >
          {SidebarContent(closeMobileMenu)}
        </aside>

        <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header class="flex h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 sm:h-16 sm:px-6">
            <div class="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => { mobileMenuOpen.value = true; }}
                class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Menu"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 class="truncate font-login-display text-base font-semibold sm:text-lg">
                <span class="text-[#0D1E35]">Doni</span>
                <span class="text-[#1a9e4a]">Santé</span>
              </h1>
            </div>
            {auth.isHospitalStaff && (
              <form onSubmit={handleSearch} class="order-3 w-full sm:order-2 sm:mx-4 sm:flex-1 sm:max-w-md">
                <input
                  v-model={searchQuery.value}
                  type="search"
                  placeholder="Rechercher un patient..."
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-[#3DDC6C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7CFF6A]/25 sm:px-4 sm:py-2.5"
                />
              </form>
            )}
            <div class="order-2 flex shrink-0 items-center gap-2 sm:order-3">
              <span class="hidden max-w-[120px] truncate text-sm font-medium text-slate-600 sm:inline md:max-w-[180px]">{auth.user?.full_name}</span>
              <button
                onClick={() => auth.logout()}
                class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:px-4 hover:sm:border-[#7CFF6A]/40 hover:sm:text-[#0D1E35]"
              >
                Déconnexion
              </button>
            </div>
          </header>
          <main class="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 p-4 sm:p-6">
            <router-view />
          </main>
        </div>
        <router-view name="toast" />
      </div>
    );
  },
});
