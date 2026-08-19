import { computed, onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'

import { fetchOperationalRecords } from '@/api/analytics'
import type {
  ChartPoint,
  DashboardFilters,
  KpiMetrics,
  MetricTrend,
  MetricTrends,
  MonthlyMetricPoint,
  MonthlyTotals,
  OperationalRecord,
} from '@/types/analytics'

const allRegions = 'All Regions' as const
const allStatuses = 'All Statuses' as const

const defaultFilters: DashboardFilters = {
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  region: allRegions,
  status: allStatuses,
}

const monthFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: 'numeric',
})

function computeTrend(current: number, previous: number): MetricTrend {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'up' : 'flat',
      changePercent: current > 0 ? 100 : 0,
    }
  }

  const changePercent = ((current - previous) / previous) * 100

  if (Math.abs(changePercent) < 0.5) {
    return { direction: 'flat', changePercent }
  }

  return { direction: changePercent > 0 ? 'up' : 'down', changePercent }
}

export const useAnalyticsStore = defineStore('analytics', () => {
  const records = ref<OperationalRecord[]>([])
  const filters = ref<DashboardFilters>({ ...defaultFilters })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdatedAt = ref<Date | null>(null)

  const isInitialLoading = computed(() => loading.value && lastUpdatedAt.value === null)
  let recordsRequestController: AbortController | null = null

  const availableRegions = computed(() =>
    Array.from(new Set(records.value.map((record) => record.region))).sort(),
  )

  const availableStatuses = computed(() =>
    Array.from(new Set(records.value.map((record) => record.status))).sort(),
  )

  const filteredRecords = computed(() =>
    records.value.filter((record) => {
      const isAfterStart = !filters.value.startDate || record.date >= filters.value.startDate
      const isBeforeEnd = !filters.value.endDate || record.date <= filters.value.endDate
      const matchesRegion =
        filters.value.region === allRegions || record.region === filters.value.region
      const matchesStatus =
        filters.value.status === allStatuses || record.status === filters.value.status

      return isAfterStart && isBeforeEnd && matchesRegion && matchesStatus
    }),
  )

  const metrics = computed<KpiMetrics>(() => {
    const totals = filteredRecords.value.reduce(
      (summary, record) => ({
        revenue: summary.revenue + record.revenue,
        activeCustomers: summary.activeCustomers + record.activeCustomers,
        transactions: summary.transactions + record.transactions,
        conversions: summary.conversions + record.conversions,
      }),
      {
        revenue: 0,
        activeCustomers: 0,
        transactions: 0,
        conversions: 0,
      },
    )

    return {
      revenue: totals.revenue,
      activeCustomers: totals.activeCustomers,
      transactions: totals.transactions,
      conversionRate: totals.transactions === 0 ? 0 : totals.conversions / totals.transactions,
    }
  })

  const monthlyMetrics = computed<MonthlyMetricPoint[]>(() => {
    const buckets = new Map<string, MonthlyTotals>()

    for (const record of filteredRecords.value) {
      const monthKey = record.date.slice(0, 7)
      const bucket: MonthlyTotals = buckets.get(monthKey) ?? {
        revenue: 0,
        transactions: 0,
        activeCustomers: 0,
        conversions: 0,
      }

      bucket.revenue += record.revenue
      bucket.transactions += record.transactions
      bucket.activeCustomers += record.activeCustomers
      bucket.conversions += record.conversions
      buckets.set(monthKey, bucket)
    }

    return Array.from(buckets.entries())
      .sort(([firstMonth], [secondMonth]) => firstMonth.localeCompare(secondMonth))
      .map(([month, totals]) => ({
        month,
        label: monthFormatter.format(new Date(`${month}-01T00:00:00`)),
        revenue: totals.revenue,
        transactions: totals.transactions,
        activeCustomers: totals.activeCustomers,
        conversionRate: totals.transactions === 0 ? 0 : totals.conversions / totals.transactions,
      }))
  })

  const revenueTrend = computed<ChartPoint[]>(() =>
    monthlyMetrics.value.map((point) => ({ label: point.label, value: point.revenue })),
  )

  const trends = computed<MetricTrends | null>(() => {
    const current = monthlyMetrics.value[monthlyMetrics.value.length - 1]
    const previous = monthlyMetrics.value[monthlyMetrics.value.length - 2]

    if (!current || !previous) {
      return null
    }

    return {
      revenue: computeTrend(current.revenue, previous.revenue),
      transactions: computeTrend(current.transactions, previous.transactions),
      activeCustomers: computeTrend(current.activeCustomers, previous.activeCustomers),
      conversionRate: computeTrend(current.conversionRate, previous.conversionRate),
    }
  })

  const revenueByRegion = computed<ChartPoint[]>(() => {
    const totals = new Map<string, number>()

    for (const record of filteredRecords.value) {
      totals.set(record.region, (totals.get(record.region) ?? 0) + record.revenue)
    }

    return Array.from(totals.entries())
      .sort(([firstRegion], [secondRegion]) => firstRegion.localeCompare(secondRegion))
      .map(([region, revenue]) => ({
        label: region,
        value: revenue,
      }))
  })

  async function loadRecords(): Promise<void> {
    recordsRequestController?.abort()

    const requestController = new AbortController()
    recordsRequestController = requestController
    loading.value = true
    error.value = null

    try {
      const nextRecords = await fetchOperationalRecords(requestController.signal)

      if (recordsRequestController !== requestController) {
        return
      }

      records.value = nextRecords
      lastUpdatedAt.value = new Date()
    } catch (caughtError) {
      if (recordsRequestController !== requestController) {
        return
      }

      error.value = caughtError instanceof Error ? caughtError.message : 'Unable to load records'
    } finally {
      if (recordsRequestController === requestController) {
        recordsRequestController = null
        loading.value = false
      }
    }
  }

  function updateFilters(nextFilters: Partial<DashboardFilters>): void {
    filters.value = {
      ...filters.value,
      ...nextFilters,
    }
  }

  function resetFilters(): void {
    filters.value = { ...defaultFilters }
  }

  onScopeDispose(() => {
    recordsRequestController?.abort()
  })

  return {
    allRegions,
    allStatuses,
    records,
    filters,
    loading,
    error,
    lastUpdatedAt,
    isInitialLoading,
    availableRegions,
    availableStatuses,
    filteredRecords,
    metrics,
    monthlyMetrics,
    trends,
    revenueTrend,
    revenueByRegion,
    loadRecords,
    updateFilters,
    resetFilters,
  }
})
