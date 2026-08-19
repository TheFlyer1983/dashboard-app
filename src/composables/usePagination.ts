import { computed, ref, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export function usePagination<T>(items: MaybeRefOrGetter<readonly T[]>, initialItemsPerPage = 8) {
  const page = ref(1)
  const itemsPerPage = ref(initialItemsPerPage)

  const pageCount = computed(() =>
    Math.max(1, Math.ceil(toValue(items).length / itemsPerPage.value)),
  )

  const paginatedItems = computed(() => {
    const start = (page.value - 1) * itemsPerPage.value
    return toValue(items).slice(start, start + itemsPerPage.value)
  })

  watch([() => toValue(items), itemsPerPage], () => {
    page.value = 1
  })

  watch(pageCount, (nextPageCount) => {
    if (page.value > nextPageCount) {
      page.value = nextPageCount
    }
  })

  return {
    itemsPerPage,
    page,
    pageCount,
    paginatedItems,
  }
}
