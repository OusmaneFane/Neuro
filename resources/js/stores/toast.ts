import { defineStore } from 'pinia';
import { ref } from 'vue';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let id = 0;

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);

  function add(message: string, type: Toast['type'] = 'info') {
    const toast: Toast = { id: ++id, message, type };
    toasts.value.push(toast);
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== toast.id);
    }, 4000);
  }

  return { toasts, add };
});
