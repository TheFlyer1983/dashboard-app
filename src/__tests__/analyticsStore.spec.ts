import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAnalyticsStore } from '@/stores/analytics'
import type { OperationalRecord } from '@/types/analytics'

describe('analytics store loading state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('distinguishes the initial load from subsequent refreshes', () => {
    const store = useAnalyticsStore()

    expect(store.isInitialLoading).toBe(false)

    store.loading = true
    expect(store.isInitialLoading).toBe(true)

    store.lastUpdatedAt = new Date('2026-08-11T12:00:00Z')
    expect(store.isInitialLoading).toBe(false)
  })

  it('cancels a superseded records request and keeps the latest response', async () => {
    const pendingRequests: {
      signal: AbortSignal
      resolve: (response: Response) => void
    }[] = []

    vi.stubGlobal(
      'fetch',
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        const signal = init?.signal

        if (!signal) {
          throw new Error('Expected an abort signal')
        }

        return new Promise<Response>((resolve, reject) => {
          pendingRequests.push({ signal, resolve })
          signal.addEventListener('abort', () => {
            reject(new DOMException('The request was aborted', 'AbortError'))
          })
        })
      }),
    )

    const store = useAnalyticsStore()
    const firstLoad = store.loadRecords()
    const secondLoad = store.loadRecords()

    expect(pendingRequests).toHaveLength(2)
    expect(pendingRequests[0]?.signal.aborted).toBe(true)

    const latestRecord: OperationalRecord = {
      id: 1,
      date: '2026-08-11',
      businessUnit: 'Operations',
      region: 'Europe',
      revenue: 1000,
      transactions: 10,
      activeCustomers: 8,
      conversions: 4,
      status: 'Healthy',
    }

    pendingRequests[1]?.resolve(
      new Response(JSON.stringify([latestRecord]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await Promise.all([firstLoad, secondLoad])

    expect(store.records).toEqual([latestRecord])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })
})
