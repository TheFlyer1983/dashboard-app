import { nextTick, ref } from 'vue'
import { describe, expect, it } from 'vitest'

import { usePagination } from '@/composables/usePagination'
import { useSortableTable } from '@/composables/useSortableTable'

interface TestRecord {
  name: string
  revenue: number
}

describe('useSortableTable', () => {
  it('searches and sorts records', () => {
    const records = ref<TestRecord[]>([
      { name: 'North', revenue: 100 },
      { name: 'South', revenue: 300 },
      { name: 'East', revenue: 200 },
    ])

    const table = useSortableTable<TestRecord, keyof TestRecord>(records, {
      searchKeys: ['name', 'revenue'],
      initialSortKey: 'revenue',
      initialSortDirection: 'desc',
    })

    expect(table.sortedItems.value.map((record) => record.name)).toEqual(['South', 'East', 'North'])

    table.search.value = 'north'
    expect(table.sortedItems.value).toEqual([{ name: 'North', revenue: 100 }])

    table.search.value = null
    table.setSort('name')
    expect(table.sortedItems.value.map((record) => record.name)).toEqual(['East', 'North', 'South'])
    expect(table.sortIcon('name')).toBe('mdi-arrow-up')
  })
})

describe('usePagination', () => {
  it('paginates records and resets when page size changes', async () => {
    const records = ref([1, 2, 3, 4, 5])
    const pagination = usePagination(records, 2)

    pagination.page.value = 2
    expect(pagination.paginatedItems.value).toEqual([3, 4])
    expect(pagination.pageCount.value).toBe(3)

    pagination.itemsPerPage.value = 5
    await nextTick()

    expect(pagination.page.value).toBe(1)
    expect(pagination.paginatedItems.value).toEqual([1, 2, 3, 4, 5])
  })
})
