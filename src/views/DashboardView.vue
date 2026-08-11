<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'

import { useAnalyticsStore } from '@/stores/analytics'
import type { KpiCard, NavItem } from '@/types/dashboard'
import '@/assets/styles/dashboard-layout.css'

import AppSidebar from '@/components/AppSidebar.vue'
import AppTopBar from '@/components/AppTopBar.vue'
import FilterToolbar from '@/components/FilterToolbar.vue'
import KpiCardGrid from '@/components/KpiCardGrid.vue'
import RecordsTable from '@/components/RecordsTable.vue'
import RevenueTrends from '@/components/RevenueTrends.vue'
import { currencyFormatter, numberFormatter, percentFormatter } from '@/utils/formatters'

const analyticsStore = useAnalyticsStore()
const {
  availableRegions,
  availableStatuses,
  error,
  filteredRecords,
  filters,
  isInitialLoading,
  lastUpdatedAt,
  loading,
  metrics,
  trends,
} = storeToRefs(analyticsStore)

const { mdAndDown } = useDisplay()
const sidebarOpen = ref(true)
const activeSection = ref('overview')

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'mdi-view-dashboard-outline' },
  { id: 'trends', label: 'Trends', icon: 'mdi-chart-line' },
  { id: 'records', label: 'Records', icon: 'mdi-table-large' },
]

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

async function refresh(): Promise<void> {
  await analyticsStore.loadRecords()
}
</script>

<template>
  <v-layout class="dashboard-layout">
    <AppSidebar
      v-model="sidebarOpen"
      :temporary="mdAndDown"
      :active-section="activeSection"
      :nav-items="navItems"
      @select-section="scrollToSection"
    />

    <AppTopBar
      :loading="loading"
      :last-updated-at="lastUpdatedAt"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
      @refresh="refresh"
    />

    <v-main>
      <v-container fluid class="dashboard-content">
        <v-alert v-if="error" type="error" variant="tonal" class="mb-6" border="start">
          {{ error }}
        </v-alert>

        <section id="overview" class="dashboard-section">
          <FilterToolbar
            :filters="filters"
            :available-regions="availableRegions"
            :available-statuses="availableStatuses"
            :all-regions="analyticsStore.allRegions"
            :all-statuses="analyticsStore.allStatuses"
            @update-filters="analyticsStore.updateFilters"
            @reset="analyticsStore.resetFilters"
          />

          <KpiCardGrid :cards="kpiCards" :is-initial-loading="isInitialLoading" />
        </section>

        <RevenueTrends :is-initial-loading="isInitialLoading" />

        <RecordsTable :records="filteredRecords" :is-initial-loading="isInitialLoading" />
      </v-container>
    </v-main>
  </v-layout>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: #f4f6fb;
}

.dashboard-content {
  padding: 1.75rem 2rem 3rem;
  max-width: 1440px;
}
</style>
