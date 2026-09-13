import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Doughnut } from 'vue-chartjs';
import { defineComponent, computed, type PropType } from 'vue';

ChartJS.register(ArcElement, Tooltip, Legend);

const palette = [
  'rgb(20, 184, 166)',   // teal
  'rgb(56, 189, 248)',   // sky
  'rgb(245, 158, 11)',   // amber
  'rgb(244, 63, 94)',    // rose
  'rgb(139, 92, 246)',   // violet
  'rgb(34, 197, 94)',    // green
];

export default defineComponent({
  name: 'DoughnutChart',
  components: { Doughnut },
  props: {
    labels: { type: Array as PropType<string[]>, required: true },
    data: { type: Array as PropType<number[]>, required: true },
    height: { type: Number, default: 240 },
    options: { type: Object as PropType<ChartOptions<'doughnut'>> },
  },
  setup(props) {
    const chartData = computed(() => ({
      labels: props.labels,
      datasets: [
        {
          data: props.data,
          backgroundColor: props.labels.map((_, i) => palette[i % palette.length]),
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    }));

    const chartOptions: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            font: { size: 12 },
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((ctx.raw as number) / total * 100).toFixed(1) : 0;
              return `${ctx.label}: ${ctx.raw} (${pct}%)`;
            },
          },
        },
      },
    };

    return () => (
      <div style={{ height: `${props.height}px` }}>
        <Doughnut data={chartData.value} options={{ ...chartOptions, ...props.options }} />
      </div>
    );
  },
});
