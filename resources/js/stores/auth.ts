import { api, clearTokens, getAccessToken, setTokens } from '@/lib/api';
import type { User } from '@/types';
import { HOSPITAL_STAFF_ROLES } from '@/types';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(getAccessToken());

  const isAuthenticated = computed(() => !!token.value);
  const isHospitalStaff = computed(() =>
    user.value ? HOSPITAL_STAFF_ROLES.includes(user.value.role) : false
  );
  const isPatient = computed(() => user.value?.role === 'PATIENT');

  async function fetchUser() {
    if (!token.value) return;
    const { data } = await api.get<{ user: User }>('/auth/me');
    user.value = data.user;
    return data.user;
  }

  function setUser(u: User | null) {
    user.value = u;
  }

  function login(access: string, refresh: string, u: User) {
    setTokens(access, refresh);
    token.value = access;
    user.value = u;
  }

  function logout() {
    api.post('/auth/logout').catch(() => {});
    clearTokens();
    token.value = null;
    user.value = null;
  }

  /** Efface la session locale sans appel API (ex. token invalide / réseau). */
  function abandonSession() {
    clearTokens();
    token.value = null;
    user.value = null;
  }

  return {
    user,
    token,
    isAuthenticated,
    isHospitalStaff,
    isPatient,
    fetchUser,
    setUser,
    login,
    logout,
    abandonSession,
  };
});
