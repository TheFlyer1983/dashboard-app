import { computed, ref, shallowRef, toValue } from 'vue'
import type { MaybeRefOrGetter, ShallowRef } from 'vue'

import type { SortDirection } from '@/types/dashboard'

interface UseSortableTableOptions<T, K extends keyof T> {
  searchKeys: readonly (keyof T)[]
  initialSortKey: K
  initialSortDirection?: SortDirection
}

export function useSortableTable<T, K extends keyof T>(
  items: MaybeRefOrGetter<readonly T[]>,
  options: UseSortableTableOptions<T, K>,
) {
  const search = ref<string | null>(null)
  const sortKey = shallowRef(options.initialSortKey) as ShallowRef<K>
  const sortDirection = ref<SortDirection>(options.initialSortDirection ?? 'asc')

  const searchedItems = computed<readonly T[]>(() => {
    const query = search.value?.trim().toLowerCase()
    const currentItems = toValue(items)

    if (!query) {
      return currentItems
    }

    return currentItems.filter((item) =>
      options.searchKeys
        .map((key) => String(item[key]))
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  })

  const sortedItems = computed<T[]>(() => {
    const direction = sortDirection.value === 'asc' ? 1 : -1

    return [...searchedItems.value].sort((firstItem, secondItem) => {
      const firstValue = firstItem[sortKey.value]
      const secondValue = secondItem[sortKey.value]

      if (typeof firstValue === 'number' && typeof secondValue === 'number') {
        return (firstValue - secondValue) * direction
      }

      return String(firstValue).localeCompare(String(secondValue)) * direction
    })
  })

  function setSort(nextSortKey: K): void {
    if (sortKey.value === nextSortKey) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      return
    }

    sortKey.value = nextSortKey
    sortDirection.value = 'asc'
  }

  function sortIcon(headerKey: K): string {
    if (sortKey.value !== headerKey) {
      return 'mdi-swap-vertical'
    }

    return sortDirection.value === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
  }

  return {
    search,
    searchedItems,
    setSort,
    sortDirection,
    sortIcon,
    sortKey,
    sortedItems,
  }
}
