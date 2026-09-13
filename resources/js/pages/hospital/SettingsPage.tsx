import Card from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SettingsPage',
  setup() {
    const auth = useAuthStore();

    return () => (
      <div class="space-y-8">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Paramètres
          </h1>
          <p class="mt-1 text-slate-600">Gérez votre compte et vos préférences</p>
        </div>
        <Card class="p-6">
          <h3 class="text-lg font-semibold text-slate-800">Compte</h3>
          <dl class="mt-6 space-y-5">
            <div>
              <dt class="text-sm font-medium text-slate-500">Nom</dt>
              <dd class="mt-1 font-semibold text-slate-800">{auth.user?.full_name}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-500">Email</dt>
              <dd class="mt-1 font-semibold text-slate-800">{auth.user?.email}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-500">Rôle</dt>
              <dd class="mt-1">
                <span class="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
                  {auth.user?.role}
                </span>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    );
  },
});
