<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useAnalyticsStore } from '@/stores/analytics'
import { storeToRefs } from 'pinia'
import { currencyFormatter } from '@/utils/formatters'

const analyticsStore = useAnalyticsStore()
const { revenueTrend, revenueByRegion } = storeToRefs(analyticsStore)

defineProps<{
  loading: boolean
  lastUpdatedAt: Date | null
}>()

const revenueTrendOptions = computed<ApexOptions>(() => ({
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
  },
  colors: ['#4f46e5'],
  dataLabels: { enabled: false },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.02,
      stops: [0, 90, 100],
    },
  },
  grid: {
    borderColor: '#eef1f8',
    strokeDashArray: 4,
    padding: { left: 8, right: 8 },
  },
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  markers: {
    size: 0,
    hover: { size: 5 },
  },
  xaxis: {
    categories: revenueTrend.value.map((point) => point.label),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#64748b' } },
  },
  yaxis: {
    labels: {
      style: { colors: '#64748b' },
      formatter: (value) => currencyFormatter.format(value),
    },
  },
  tooltip: {
    y: {
      formatter: (value) => currencyFormatter.format(value),
    },
  },
}))

const revenueTrendSeries = computed(() => [
  {
    name: 'Revenue',
    data: revenueTrend.value.map((point) => point.value),
  },
])

const revenueByRegionOptions = computed<ApexOptions>(() => ({
  chart: {
    fontFamily: 'inherit',
  },
  colors: ['#4f46e5', '#0f766e', '#0284c7', '#d97706'],
  dataLabels: {
    formatter: (value) => `${Number(value).toFixed(1)}%`,
  },
  labels: revenueByRegion.value.map((point) => point.label),
  legend: {
    position: 'bottom',
    labels: { colors: '#334155' },
    markers: { size: 8 },
  },
  stroke: { colors: ['#ffffff'] },
  plotOptions: {
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          value: {
            color: '#0f172a',
            formatter: (value) => currencyFormatter.format(Number(value)),
          },
          total: {
            show: true,
            label: 'Total revenue',
            color: '#64748b',
            formatter: () => currencyFormatter.format(revenueTotal.value),
          },
        },
      },
    },
  },
  tooltip: {
    y: {
      formatter: (value) => currencyFormatter.format(value),
    },
  },
}))

const revenueTotal = computed(() =>
  revenueByRegion.value.reduce((total, point) => total + point.value, 0),
)

const revenueByRegionSeries = computed(() => revenueByRegion.value.map((point) => point.value))
</script>

<template>
  <section id="trends" class="dashboard-section">
    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="dashboard-card" elevation="0">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal" rounded="lg">
                <v-icon icon="mdi-chart-line" />
              </v-avatar>
            </template>
            <v-card-title>Revenue Trend</v-card-title>
            <v-card-subtitle>Monthly revenue over time</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <v-skeleton-loader v-if="loading && !lastUpdatedAt" type="image" height="320" />
            <VueApexCharts
              v-else
              type="area"
              height="320"
              :options="revenueTrendOptions"
              :series="revenueTrendSeries"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="dashboard-card" elevation="0">
          <v-card-item>
            <template #prepend>
              <v-avatar color="secondary" variant="tonal" rounded="lg">
                <v-icon icon="mdi-chart-donut" />
              </v-avatar>
            </template>
            <v-card-title>Revenue by Region</v-card-title>
            <v-card-subtitle>Split across selected regions</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <v-skeleton-loader v-if="loading && !lastUpdatedAt" type="image" height="320" />
            <VueApexCharts
              v-else
              type="donut"
              height="320"
              :options="revenueByRegionOptions"
              :series="revenueByRegionSeries"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </section>
</template>
