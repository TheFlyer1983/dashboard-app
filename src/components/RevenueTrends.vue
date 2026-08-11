<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useAnalyticsStore } from '@/stores/analytics'
import { storeToRefs } from 'pinia'
import { useTheme } from 'vuetify'
import { currencyFormatter } from '@/utils/formatters'

const analyticsStore = useAnalyticsStore()
const { revenueTrend, revenueByRegion } = storeToRefs(analyticsStore)
const theme = useTheme()

defineProps<{
  isInitialLoading: boolean
}>()

const themeColors = computed(() => ({
  primary: String(theme.current.value.colors.primary),
  secondary: String(theme.current.value.colors.secondary),
  info: String(theme.current.value.colors.info),
  warning: String(theme.current.value.colors.warning),
  surface: String(theme.current.value.colors.surface),
}))

const revenueTrendOptions = computed<ApexOptions>(() => ({
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
  },
  colors: [themeColors.value.primary],
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
  colors: [
    themeColors.value.primary,
    themeColors.value.secondary,
    themeColors.value.info,
    themeColors.value.warning,
  ],
  dataLabels: {
    formatter: (value) => `${Number(value).toFixed(1)}%`,
  },
  labels: revenueByRegion.value.map((point) => point.label),
  legend: {
    position: 'bottom',
    labels: { colors: '#334155' },
    markers: { size: 8 },
  },
  stroke: { colors: [themeColors.value.surface] },
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
            <v-skeleton-loader v-if="isInitialLoading" type="image" height="320" />
            <div v-else aria-hidden="true">
              <VueApexCharts
                type="area"
                height="320"
                :options="revenueTrendOptions"
                :series="revenueTrendSeries"
              />
            </div>

            <table class="visually-hidden">
              <caption>
                Monthly revenue trend
              </caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="point in revenueTrend" :key="point.label">
                  <td>{{ point.label }}</td>
                  <td>{{ currencyFormatter.format(point.value) }}</td>
                </tr>
              </tbody>
            </table>
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
            <v-skeleton-loader v-if="isInitialLoading" type="image" height="320" />
            <div v-else aria-hidden="true">
              <VueApexCharts
                type="donut"
                height="320"
                :options="revenueByRegionOptions"
                :series="revenueByRegionSeries"
              />
            </div>

            <table class="visually-hidden">
              <caption>
                Revenue by region
              </caption>
              <thead>
                <tr>
                  <th scope="col">Region</th>
                  <th scope="col">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="point in revenueByRegion" :key="point.label">
                  <td>{{ point.label }}</td>
                  <td>{{ currencyFormatter.format(point.value) }}</td>
                </tr>
              </tbody>
            </table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </section>
</template>
