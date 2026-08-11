import type { OperationalRecord } from '@/types/analytics'

const operationalRecordsPath = '/api/operational-records.json'

function createApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '')

  if (!baseUrl) {
    return path
  }

  return `${baseUrl}/${path.replace(/^\/+/, '')}`
}

export async function fetchOperationalRecords(signal?: AbortSignal): Promise<OperationalRecord[]> {
  const response = await fetch(createApiUrl(operationalRecordsPath), { signal })

  if (!response.ok) {
    throw new Error(`Unable to load operational records (${response.status})`)
  }

  return (await response.json()) as OperationalRecord[]
}
