<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ApexOptions } from 'apexcharts'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'
import VueApexCharts from 'vue3-apexcharts'

import { useAnalyticsStore } from '@/stores/analytics'
import type { DashboardFilters, OperationalRecord, TrendDirection } from '@/types/analytics'
import type { KpiCard, NavItem, SortableKey, SortDirection, TableHeader } from '@/types/dashboard'
import '@/assets/styles/dashboard-layout.css';

import RecordsTable from '@/components/RecordsTable.vue'

const analyticsStore = useAnalyticsStore()
const {
  availableRegions,
  availableStatuses,
  error,
  filteredRecords,
  filters,
  lastUpdatedAt,
  loading,
  metrics,
  revenueByRegion,
  revenueTrend,
  trends,
} = storeToRefs(analyticsStore)

const { mdAndDown } = useDisplay()

const search = ref('')
const page = ref(1)
const itemsPerPage = ref(8)
const sortKey = ref<SortableKey>('date')
const sortDirection = ref<SortDirection>('desc')
const sidebarOpen = ref(true)
const activeSection = ref('overview')

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'mdi-view-dashboard-outline' },
  { id: 'trends', label: 'Trends', icon: 'mdi-chart-line' },
  { id: 'records', label: 'Records', icon: 'mdi-table-large' },
]

const tableHeaders: TableHeader[] = [
  { title: 'Date', key: 'date' },
  { title: 'Business Unit', key: 'businessUnit' },
  { title: 'Region', key: 'region' },
  { title: 'Revenue', key: 'revenue', align: 'end' },
  { title: 'Transactions', key: 'transactions', align: 'end' },
  { title: 'Status', key: 'status' },
]

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-GB')
const percentFormatter = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
})

const regionFilterItems = computed(() => [analyticsStore.allRegions, ...availableRegions.value])
const statusFilterItems = computed(() => [analyticsStore.allStatuses, ...availableStatuses.value])

const lastUpdatedLabel = computed(() =>
  lastUpdatedAt.value ? `Updated ${timeFormatter.format(lastUpdatedAt.value)}` : 'Loading data…',
)

const activeFilterChips = computed(() => {
  const chips: { key: keyof DashboardFilters; label: string }[] = []

  if (filters.value.region !== analyticsStore.allRegions) {
    chips.push({ key: 'region', label: `Region: ${filters.value.region}` })
  }

  if (filters.value.status !== analyticsStore.allStatuses) {
    chips.push({ key: 'status', label: `Status: ${filters.value.status}` })
  }

  if (filters.value.startDate) {
    chips.push({ key: 'startDate', label: `From ${filters.value.startDate}` })
  }

  if (filters.value.endDate) {
    chips.push({ key: 'endDate', label: `To ${filters.value.endDate}` })
  }

  return chips
})

const kpiCards = computed<KpiCard[]>(() => {
  const trendMap = trends.value

  return [
    {
      title: 'Revenue',
      metricKey: 'revenue',
      value: currencyFormatter.format(metrics.value.revenue),
      subtitle: `${numberFormatter.format(filteredRecords.value.length)} filtered records`,
      icon: 'mdi-cash-multiple',
      color: 'primary',
      trend: trendMap ? trendMap.revenue : null,
    },
    {
      title: 'Active Customers',
      metricKey: 'activeCustomers',
      value: numberFormatter.format(metrics.value.activeCustomers),
      subtitle: 'Across selected operations',
      icon: 'mdi-account-group',
      color: 'secondary',
      trend: trendMap ? trendMap.activeCustomers : null,
    },
    {
      title: 'Transactions',
      metricKey: 'transactions',
      value: numberFormatter.format(metrics.value.transactions),
      subtitle: 'Completed transactions',
      icon: 'mdi-swap-horizontal',
      color: 'info',
      trend: trendMap ? trendMap.transactions : null,
    },
    {
      title: 'Conversion Rate',
      metricKey: 'conversionRate',
      value: percentFormatter.format(metrics.value.conversionRate),
      subtitle: 'Conversions / transactions',
      icon: 'mdi-chart-arc',
      color: 'success',
      trend: trendMap ? trendMap.conversionRate : null,
    },
  ]
})

const revenueTotal = computed(() =>
  revenueByRegion.value.reduce((total, point) => total + point.value, 0),
)

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

const revenueByRegionSeries = computed(() => revenueByRegion.value.map((point) => point.value))

const searchedRecords = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return filteredRecords.value
  }

  return filteredRecords.value.filter((record) =>
    [
      record.date,
      record.businessUnit,
      record.region,
      record.status,
      record.revenue.toString(),
      record.transactions.toString(),
    ]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
})

const sortedRecords = computed(() => {
  const direction = sortDirection.value === 'asc' ? 1 : -1

  return [...searchedRecords.value].sort((firstRecord, secondRecord) => {
    const firstValue = firstRecord[sortKey.value]
    const secondValue = secondRecord[sortKey.value]

    if (typeof firstValue === 'number' && typeof secondValue === 'number') {
      return (firstValue - secondValue) * direction
    }

    return String(firstValue).localeCompare(String(secondValue)) * direction
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(sortedRecords.value.length / itemsPerPage.value)))

const paginatedRecords = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return sortedRecords.value.slice(start, start + itemsPerPage.value)
})

watch([searchedRecords, itemsPerPage], () => {
  page.value = 1
})

watch(pageCount, (nextPageCount) => {
  if (page.value > nextPageCount) {
    page.value = nextPageCount
  }
})

let sectionObserver: IntersectionObserver | null = null

onMounted(() => {
  void analyticsStore.loadRecords()

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries.find((entry) => entry.isIntersecting)

      if (visibleEntry) {
        activeSection.value = visibleEntry.target.id
      }
    },
    { rootMargin: '-112px 0px -55% 0px', threshold: 0.1 },
  )

  for (const item of navItems) {
    const sectionEl = document.getElementById(item.id)

    if (sectionEl) {
      sectionObserver.observe(sectionEl)
    }
  }
})

onBeforeUnmount(() => {
  sectionObserver?.disconnect()
})

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function setSidebarOpen(value: boolean): void {
  sidebarOpen.value = value
}

async function refresh(): Promise<void> {
  await analyticsStore.loadRecords()
}

function exportCsv(): void {
  const header = ['Date', 'Business Unit', 'Region', 'Revenue', 'Transactions', 'Status']
  const rows = sortedRecords.value.map((record) => [
    record.date,
    record.businessUnit,
    record.region,
    record.revenue,
    record.transactions,
    record.status,
  ])

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `operational-records-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function setStartDate(value: unknown): void {
  analyticsStore.updateFilters({ startDate: typeof value === 'string' ? value : '' })
}

function setEndDate(value: unknown): void {
  analyticsStore.updateFilters({ endDate: typeof value === 'string' ? value : '' })
}

function setRegion(value: unknown): void {
  analyticsStore.updateFilters({
    region: (typeof value === 'string' ? value : analyticsStore.allRegions) as DashboardFilters['region'],
  })
}

function setStatus(value: unknown): void {
  analyticsStore.updateFilters({
    status: (typeof value === 'string' ? value : analyticsStore.allStatuses) as DashboardFilters['status'],
  })
}

function clearFilterChip(key: keyof DashboardFilters): void {
  if (key === 'region') {
    setRegion(analyticsStore.allRegions)
  } else if (key === 'status') {
    setStatus(analyticsStore.allStatuses)
  } else if (key === 'startDate') {
    setStartDate('')
  } else if (key === 'endDate') {
    setEndDate('')
  }
}

function setSort(nextSortKey: SortableKey): void {
  if (sortKey.value === nextSortKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = nextSortKey
  sortDirection.value = 'asc'
}

function sortIcon(headerKey: SortableKey): string {
  if (sortKey.value !== headerKey) {
    return 'mdi-swap-vertical'
  }

  return sortDirection.value === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
}

function statusColor(status: OperationalRecord['status']): string {
  const colors: Record<OperationalRecord['status'], string> = {
    Healthy: 'success',
    Attention: 'warning',
    'At Risk': 'error',
  }

  return colors[status]
}

function trendIcon(direction: TrendDirection): string {
  if (direction === 'up') return 'mdi-trending-up'
  if (direction === 'down') return 'mdi-trending-down'
  return 'mdi-trending-neutral'
}

function trendColor(direction: TrendDirection): string {
  if (direction === 'up') return 'success'
  if (direction === 'down') return 'error'
  return 'grey-darken-1'
}
</script>

<template>
  <v-layout class="dashboard-layout">
    <v-navigation-drawer
      :model-value="sidebarOpen"
      :temporary="mdAndDown"
      :permanent="!mdAndDown"
      width="256"
      class="app-sidebar"
      @update:model-value="setSidebarOpen"
    >
      <div class="brand">
        <v-avatar color="white" variant="flat" size="36" class="brand-mark">
          <v-icon icon="mdi-hexagon-multiple" color="#4f46e5" />
        </v-avatar>
        <div>
          <strong>OpsBoard</strong>
          <span>Operational Analytics</span>
        </div>
      </div>

      <v-list nav class="sidebar-nav">
        <v-list-item
          v-for="item in navItems"
          :key="item.id"
          :prepend-icon="item.icon"
          :title="item.label"
          :active="activeSection === item.id"
          rounded="lg"
          class="sidebar-item"
          @click="scrollToSection(item.id)"
        />
      </v-list>

      <template #append>
        <div class="sidebar-footer">
          <v-divider class="sidebar-divider" />
          <div class="sidebar-footer-row">
            <v-icon icon="mdi-database-outline" size="16" />
            <span>Mock REST API</span>
          </div>
          <div class="sidebar-footer-row muted">
            <span>v1.0.0</span>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="surface" elevation="0" height="76" class="app-topbar">
      <v-btn icon="mdi-menu" variant="text" @click="sidebarOpen = !sidebarOpen" />

      <div class="topbar-heading">
        <p class="eyebrow">Dashboard</p>
        <h1>Business Operations</h1>
      </div>

      <v-spacer />

      <div class="topbar-actions">
        <span class="last-updated">
          <v-icon icon="mdi-clock-outline" size="14" />
          {{ lastUpdatedLabel }}
        </span>

        <v-btn
          icon="mdi-refresh"
          variant="tonal"
          color="primary"
          :loading="loading"
          @click="refresh"
        />

        <v-divider vertical class="topbar-divider" />

        <v-avatar color="primary" variant="tonal" size="40">
          <v-icon icon="mdi-account-tie-outline" />
        </v-avatar>
      </div>
    </v-app-bar>

    <v-main>
      <v-container fluid class="dashboard-content">
        <v-alert v-if="error" type="error" variant="tonal" class="mb-6" border="start">
          {{ error }}
        </v-alert>

        <section id="overview" class="dashboard-section">
          <v-card class="filter-toolbar" elevation="0">
            <div class="filter-toolbar-row">
              <div class="filter-field">
                <v-icon icon="mdi-calendar-range" size="18" />
                <v-text-field
                  label="Start date"
                  type="date"
                  :model-value="filters.startDate"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="setStartDate"
                />
              </div>

              <div class="filter-field">
                <v-text-field
                  label="End date"
                  type="date"
                  :model-value="filters.endDate"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="setEndDate"
                />
              </div>

              <div class="filter-field">
                <v-icon icon="mdi-earth" size="18" />
                <v-select
                  label="Region"
                  :items="regionFilterItems"
                  :model-value="filters.region"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="setRegion"
                />
              </div>

              <div class="filter-field">
                <v-icon icon="mdi-pulse" size="18" />
                <v-select
                  label="Status"
                  :items="statusFilterItems"
                  :model-value="filters.status"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="setStatus"
                />
              </div>

              <v-spacer />

              <v-btn
                variant="text"
                color="primary"
                prepend-icon="mdi-filter-remove-outline"
                @click="analyticsStore.resetFilters"
              >
                Reset
              </v-btn>
            </div>

            <div v-if="activeFilterChips.length > 0" class="filter-chip-row">
              <v-chip
                v-for="chip in activeFilterChips"
                :key="chip.key"
                size="small"
                closable
                variant="tonal"
                color="primary"
                @click:close="clearFilterChip(chip.key)"
              >
                {{ chip.label }}
              </v-chip>
            </div>
          </v-card>

          <v-row class="mt-5">
            <v-col v-for="card in kpiCards" :key="card.title" cols="12" sm="6" lg="3">
              <v-card v-if="loading && !lastUpdatedAt" class="kpi-card" elevation="0">
                <v-skeleton-loader type="avatar, article" class="kpi-skeleton" />
              </v-card>

              <v-card v-else :class="['kpi-card', `kpi-card--${card.color}`]" elevation="0">
                <div class="kpi-card-content">
                  <v-avatar :color="card.color" variant="tonal" rounded="lg" size="48">
                    <v-icon :icon="card.icon" size="22" />
                  </v-avatar>

                  <div class="kpi-text">
                    <p>{{ card.title }}</p>
                    <strong>{{ card.value }}</strong>
                    <div class="kpi-meta">
                      <v-chip
                        v-if="card.trend"
                        size="x-small"
                        variant="tonal"
                        :color="trendColor(card.trend.direction)"
                        :prepend-icon="trendIcon(card.trend.direction)"
                      >
                        {{ Math.abs(card.trend.changePercent).toFixed(1) }}%
                      </v-chip>
                      <span>{{ card.subtitle }}</span>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </section>

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

        <RecordsTable :records="filteredRecords" :loading :lastUpdatedAt="lastUpdatedAt" />
      </v-container>
    </v-main>
  </v-layout>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: #f4f6fb;
}

/* Sidebar */
.app-sidebar {
  background: linear-gradient(180deg, #1e1b4b 0%, #312e81 100%) !important;
  border: none !important;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.25rem 1rem;
}

.brand-mark {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.brand strong {
  display: block;
  color: #ffffff;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

.brand span {
  display: block;
  color: #a5b4fc;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sidebar-nav {
  padding: 0.5rem 0.75rem;
}

.sidebar-item {
  color: #c7d2fe !important;
  font-weight: 500;
  margin-bottom: 0.15rem;
}

.sidebar-item :deep(.v-list-item-title) {
  font-size: 0.92rem;
}

.sidebar-item.v-list-item--active {
  background: rgba(255, 255, 255, 0.14) !important;
  color: #ffffff !important;
}

.sidebar-item.v-list-item--active :deep(.v-icon) {
  color: #ffffff !important;
}

.sidebar-footer {
  padding: 0.75rem 1.25rem 1.25rem;
}

.sidebar-divider {
  border-color: rgba(255, 255, 255, 0.14) !important;
  margin-bottom: 0.75rem;
}

.sidebar-footer-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #c7d2fe;
  font-size: 0.78rem;
  font-weight: 600;
}

.sidebar-footer-row.muted {
  color: #818cf8;
  font-weight: 500;
  margin-top: 0.2rem;
}

/* Top bar */
.app-topbar {
  border-bottom: 1px solid #e6e9f2;
}

.app-topbar :deep(.v-toolbar__content) {
  padding-inline: 1.25rem;
  gap: 0.5rem;
}

.topbar-heading {
  margin-left: 0.5rem;
}

.topbar-heading h1 {
  margin: 0;
  color: #101323;
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.2;
}

.eyebrow {
  margin: 0 0 0.15rem;
  color: #6b7280;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.last-updated {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.topbar-divider {
  height: 28px;
}

/* Content */
.dashboard-content {
  padding: 1.75rem 2rem 3rem;
  max-width: 1440px;
}

/* Filter toolbar */
.filter-toolbar {
  border-radius: 18px;
  border: 1px solid #e6e9f2;
  padding: 1.1rem 1.25rem;
  background: #ffffff;
}

.filter-toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.filter-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 168px;
  flex: 1 1 168px;
}

.filter-field > .v-icon {
  color: #94a3b8;
}

.filter-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px dashed #e6e9f2;
}

/* Cards */
.kpi-card,
.dashboard-card {
  border: 1px solid #e6e9f2;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.kpi-card:hover,
.dashboard-card:hover {
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.kpi-card {
  position: relative;
  overflow: hidden;
  height: 100%;
}

.kpi-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--v-theme-primary, #4f46e5);
}

.kpi-card--primary::before {
  background: #4f46e5;
}

.kpi-card--secondary::before {
  background: #0f766e;
}

.kpi-card--info::before {
  background: #0284c7;
}

.kpi-card--success::before {
  background: #16a34a;
}

.kpi-skeleton {
  padding: 1.25rem;
}

.kpi-card-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.35rem;
}

.kpi-text p {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
}

.kpi-text strong {
  display: block;
  margin-top: 0.25rem;
  color: #0f172a;
  font-size: 1.65rem;
  font-weight: 700;
  line-height: 1.2;
}

.kpi-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.kpi-meta span {
  color: #94a3b8;
  font-size: 0.78rem;
}
</style>
