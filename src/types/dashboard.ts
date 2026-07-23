import type { KpiMetrics, MetricTrend } from './analytics'

export type SortDirection = 'asc' | 'desc'

export type SortableKey = 'date' | 'businessUnit' | 'region' | 'revenue' | 'transactions' | 'status'

export interface TableHeader {
  title: string
  key: SortableKey
  align?: 'start' | 'end'
}

export interface NavItem {
  id: string
  label: string
  icon: string
}

export interface KpiCard {
  title: string
  metricKey: keyof KpiMetrics
  value: string
  subtitle: string
  icon: string
  color: string
  trend: MetricTrend | null
}
