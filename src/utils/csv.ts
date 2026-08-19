import type { OperationalRecord } from '@/types/analytics'

type CsvCell = string | number | boolean | null | undefined

const operationalRecordHeader = [
  'Date',
  'Business Unit',
  'Region',
  'Revenue',
  'Transactions',
  'Status',
] as const

function escapeCsvCell(cell: CsvCell): string {
  return `"${String(cell ?? '').replace(/"/g, '""')}"`
}

export function createCsvContent(rows: readonly (readonly CsvCell[])[]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  try {
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
  } finally {
    link.remove()
    URL.revokeObjectURL(url)
  }
}

export function exportOperationalRecordsCsv(
  records: readonly OperationalRecord[],
  exportedAt = new Date(),
): void {
  const rows = records.map((record) => [
    record.date,
    record.businessUnit,
    record.region,
    record.revenue,
    record.transactions,
    record.status,
  ])

  const content = createCsvContent([operationalRecordHeader, ...rows])
  const date = exportedAt.toISOString().slice(0, 10)

  downloadCsv(content, `operational-records-${date}.csv`)
}
