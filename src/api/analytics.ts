import type { OperationalRecord } from '@/types/analytics'

const operationalRecordsEndpoint = '/api/operational-records.json'

export async function fetchOperationalRecords(): Promise<OperationalRecord[]> {
  const response = await fetch(operationalRecordsEndpoint)

  if (!response.ok) {
    throw new Error(`Unable to load operational records (${response.status})`)
  }

  return (await response.json()) as OperationalRecord[]
}
