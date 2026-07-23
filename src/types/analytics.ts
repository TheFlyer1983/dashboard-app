export type Region = 'North America' | 'Europe' | 'Asia Pacific' | 'Latin America'

export type RecordStatus = 'Healthy' | 'Attention' | 'At Risk'

export interface OperationalRecord {
  id: number
  date: string
  businessUnit: string
  region: Region
  revenue: number
  transactions: number
  activeCustomers: number
  conversions: number
  status: RecordStatus
}

export interface DashboardFilters {
  startDate: string
  endDate: string
  region: Region | 'All Regions'
  status: RecordStatus | 'All Statuses'
}

export interface KpiMetrics {
  revenue: number
  activeCustomers: number
  transactions: number
  conversionRate: number
}

export interface ChartPoint {
  label: string
  value: number
}

export interface MonthlyTotals {
  revenue: number
  transactions: number
  activeCustomers: number
  conversions: number
}

export interface MonthlyMetricPoint {
  month: string
  label: string
  revenue: number
  transactions: number
  activeCustomers: number
  conversionRate: number
}

export type TrendDirection = 'up' | 'down' | 'flat'

export interface MetricTrend {
  direction: TrendDirection
  changePercent: number
}

export type MetricTrends = Record<keyof KpiMetrics, MetricTrend>
