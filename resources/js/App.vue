<template>
  <Toast />
  <router-view v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
      <template #fallback>
        <div class="flex min-h-screen items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </template>
    </Suspense>
  </router-view>
</template>

<script setup lang="ts">
import Toast from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/auth';
import { onMounted } from 'vue';

const auth = useAuthStore();

onMounted(async () => {
  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchUser();
    } catch {
      auth.abandonSession();
    }
  }
});
</script>
