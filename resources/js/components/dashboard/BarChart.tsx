import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'vue-chartjs';
import { defineComponent, computed, type PropType } from 'vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const defaultOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#64748b' },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.2)' },
      ticks: { font: { size: 11 }, color: '#64748b' },
    },
  },
};

export default defineComponent({
  name: 'BarChart',
  components: { Bar },
  props: {
    labels: { type: Array as PropType<string[]>, required: true },
    datasets: {
      type: Array as PropType<{ label: string; data: number[]; color?: string }[]>,
      required: true,
    },
    height: { type: Number, default: 280 },
    options: { type: Object as PropType<ChartOptions<'bar'>> },
  },
  setup(props) {
    const chartData = computed(() => ({
      labels: props.labels,
      datasets: props.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.color ?? (i === 0 ? 'rgba(20, 184, 166, 0.7)' : 'rgba(56, 189, 248, 0.7)'),
        borderRadius: 8,
        borderSkipped: false,
      })),
    }));

    const chartOptions = computed(() => ({
      ...defaultOptions,
      ...props.options,
    }));

    return () => (
      <div style={{ height: `${props.height}px` }}>
        <Bar data={chartData.value} options={chartOptions.value} />
      </div>
    );
  },
});
