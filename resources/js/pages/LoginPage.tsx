import Button from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { api } from '@/lib/api';
import type { LoginResponse } from '@/types';
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

export default defineComponent({
  name: 'LoginPage',
  setup() {
    const auth = useAuthStore();
    const router = useRouter();
    const route = useRoute();
    const toast = useToastStore();
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const showPassword = ref(false);
    const errors = ref<Record<string, string>>({});

    onMounted(() => {
      document.documentElement.classList.add('login-lock');
      document.body.classList.add('login-lock');
    });
    onUnmounted(() => {
      document.documentElement.classList.remove('login-lock');
      document.body.classList.remove('login-lock');
    });

    async function submit() {
      errors.value = {};
      if (!email.value) errors.value.email = 'Email requis';
      if (!password.value) errors.value.password = 'Mot de passe requis';
      if (Object.keys(errors.value).length) return;

      loading.value = true;
      try {
        const { data } = await api.post<LoginResponse>('/auth/login', {
          email: email.value,
          password: password.value,
        });
        auth.login(data.accessToken, data.refreshToken, data.user);
        toast.add('Connexion réussie', 'success');
        const redirect = (route.query.redirect as string) || (
          data.user.role === 'PATIENT' ? '/patient/dashboard' : '/hospital/dashboard'
        );
        await router.push(redirect);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        toast.add(err.response?.data?.message ?? 'Identifiants incorrects', 'error');
      } finally {
        loading.value = false;
      }
    }

    return () => (
      <div class="login-page relative flex h-dvh max-h-dvh overflow-hidden bg-[#1a3352]">
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div class="absolute inset-0 bg-[linear-gradient(160deg,#243d5c_0%,#1a3352_45%,#152a45_100%)]" />
          <div class="login-orb login-orb-a absolute -left-24 top-[-10%] h-[45vh] w-[45vh] rounded-full bg-[#39ff6a]/20 blur-3xl" />
          <div class="login-orb login-orb-b absolute -right-20 bottom-[-15%] h-[40vh] w-[40vh] rounded-full bg-[#4a7ab0]/35 blur-3xl" />
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(57,255,106,0.14),transparent_55%)]" />
          <div
            class="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
            }}
          />
        </div>

        <div
          class={[
            'relative z-10 mx-auto flex h-full w-full max-w-6xl min-h-0 flex-1 flex-col',
            'justify-center gap-4',
            'px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]',
            'sm:gap-5 sm:px-8',
            'lg:flex-row lg:items-stretch lg:justify-start lg:gap-0 lg:px-10 lg:py-6',
          ].join(' ')}
        >
          {/* Brand */}
          <section
            class={[
              'login-fade-up flex shrink-0 flex-col items-center text-center',
              'lg:flex-1 lg:items-start lg:justify-center lg:pr-8 lg:text-left',
            ].join(' ')}
          >
            <img
              src="/DoniSante-logo-darkbg.png"
              alt="DoniSanté"
              class={[
                'w-auto max-w-[min(100%,20rem)] object-contain',
                'h-20 sm:h-24 lg:h-32 lg:max-w-none',
                'lg:object-left',
              ].join(' ')}
            />
            <h1 class="sr-only">DoniSanté</h1>
            <p
              class={[
                'login-fade-up-delay mt-2 max-w-[16rem] font-login-display font-medium leading-snug tracking-tight text-white',
                'text-[0.95rem] sm:mt-3 sm:max-w-xs sm:text-xl',
                'lg:mt-6 lg:max-w-md lg:text-[clamp(1.25rem,2.8vh,2.25rem)]',
              ].join(' ')}
            >
              Un dossier médical,<br />
              <span class="bg-linear-to-r from-[#7CFF6A] to-[#3EE0A0] bg-clip-text text-transparent">
                une identité, partout.
              </span>
            </p>
          </section>

          {/* Form */}
          <section
            class={[
              'login-fade-up-delay w-full shrink-0',
              'lg:max-w-md lg:flex-none lg:self-center lg:py-6',
            ].join(' ')}
          >
            <div
              class={[
                'flex w-full flex-col border border-white/15 bg-[#243d5c]/90 backdrop-blur-xl',
                'px-4 py-3.5 sm:px-7 sm:py-6',
              ].join(' ')}
            >
              <div class="mb-3 shrink-0 sm:mb-5">
                <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7CFF6A]/90 sm:text-xs">
                  Connexion
                </p>
                <h2 class="mt-1 font-login-display text-lg font-semibold tracking-tight text-white sm:text-2xl">
                  Accéder à votre espace
                </h2>
                <p class="mt-0.5 hidden text-xs text-slate-400 sm:mt-1 sm:block sm:text-sm">
                  Personnel soignant ou portail patient
                </p>
              </div>

              <form
                onSubmit={(e: Event) => {
                  e.preventDefault();
                  submit();
                }}
                class="space-y-3 sm:space-y-4"
              >
                <div>
                  <label for="login-email" class="mb-1 block text-sm font-medium text-slate-200">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email.value}
                    placeholder="vous@etablissement.sn"
                    autocomplete="email"
                    inputmode="email"
                    onInput={(e: Event) => {
                      email.value = (e.target as HTMLInputElement).value;
                    }}
                    class={[
                      'w-full border bg-[#1a3352]/50 px-3.5 py-2.5 text-base text-white placeholder:text-slate-400 sm:text-sm',
                      'outline-none transition focus:border-[#7CFF6A]/60 focus:ring-2 focus:ring-[#7CFF6A]/20',
                      errors.value.email ? 'border-red-400/80' : 'border-white/20',
                    ].join(' ')}
                  />
                  {errors.value.email ? (
                    <p class="mt-1 text-xs text-red-300">{errors.value.email}</p>
                  ) : null}
                </div>

                <div>
                  <label for="login-password" class="mb-1 block text-sm font-medium text-slate-200">
                    Mot de passe
                  </label>
                  <div class="relative">
                    <input
                      id="login-password"
                      type={showPassword.value ? 'text' : 'password'}
                      value={password.value}
                      placeholder="••••••••"
                      autocomplete="current-password"
                      onInput={(e: Event) => {
                        password.value = (e.target as HTMLInputElement).value;
                      }}
                      class={[
                        'w-full border bg-[#1a3352]/50 px-3.5 py-2.5 pr-14 text-base text-white placeholder:text-slate-400 sm:text-sm',
                        'outline-none transition focus:border-[#7CFF6A]/60 focus:ring-2 focus:ring-[#7CFF6A]/20',
                        errors.value.password ? 'border-red-400/80' : 'border-white/20',
                      ].join(' ')}
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-400 transition hover:text-[#7CFF6A]"
                      onClick={() => {
                        showPassword.value = !showPassword.value;
                      }}
                    >
                      {showPassword.value ? 'Masquer' : 'Voir'}
                    </button>
                  </div>
                  {errors.value.password ? (
                    <p class="mt-1 text-xs text-red-300">{errors.value.password}</p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  loading={loading.value}
                  size="lg"
                  class="h-11 w-full rounded-none! bg-[#7CFF6A]! text-sm font-semibold! text-[#061018]! hover:bg-[#9dff88]! sm:h-12"
                >
                  Se connecter
                </Button>
              </form>

            </div>
          </section>
        </div>
      </div>
    );
  },
});
