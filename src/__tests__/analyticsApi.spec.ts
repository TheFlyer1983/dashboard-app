import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchOperationalRecords } from '@/api/analytics'

describe('analytics API', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('uses the configured API base URL and forwards the abort signal', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/')

    const fetchMock = vi.fn().mockResolvedValue(
      new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const controller = new AbortController()
    await fetchOperationalRecords(controller.signal)

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/api/operational-records.json', {
      signal: controller.signal,
    })
  })
})
