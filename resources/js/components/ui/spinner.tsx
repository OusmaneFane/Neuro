import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Spinner',
  setup(_, { attrs }) {
    return () => (
      <div
        {...attrs}
        class="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"
      />
    );
  },
});
