<script setup lang="ts">
import { usePagination } from '@/composables/usePagination'
import { useSortableTable } from '@/composables/useSortableTable'
import type { OperationalRecord } from '@/types/analytics'
import type { SortableKey, TableHeader } from '@/types/dashboard'
import { exportOperationalRecordsCsv } from '@/utils/csv'
import { currencyFormatter, numberFormatter } from '@/utils/formatters'

const props = defineProps<{
  records: OperationalRecord[]
  isInitialLoading: boolean
}>()

const tableHeaders: TableHeader[] = [
  { title: 'Date', key: 'date' },
  { title: 'Business Unit', key: 'businessUnit' },
  { title: 'Region', key: 'region' },
  { title: 'Revenue', key: 'revenue', align: 'end' },
  { title: 'Transactions', key: 'transactions', align: 'end' },
  { title: 'Status', key: 'status' },
]

const {
  search,
  setSort,
  sortDirection,
  sortIcon,
  sortKey,
  sortedItems: sortedRecords,
} = useSortableTable<OperationalRecord, SortableKey>(() => props.records, {
  searchKeys: ['date', 'businessUnit', 'region', 'status', 'revenue', 'transactions'],
  initialSortKey: 'date',
  initialSortDirection: 'desc',
})

const {
  itemsPerPage,
  page,
  pageCount,
  paginatedItems: paginatedRecords,
} = usePagination(sortedRecords)

function statusColor(status: OperationalRecord['status']): string {
  const colors: Record<OperationalRecord['status'], string> = {
    Healthy: 'success',
    Attention: 'warning',
    'At Risk': 'error',
  }

  return colors[status]
}

function ariaSort(headerKey: SortableKey): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== headerKey) {
    return 'none'
  }

  return sortDirection.value === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <section id="records" class="dashboard-section">
    <v-card class="dashboard-card records-card" elevation="0">
      <div class="records-toolbar">
        <div class="records-heading">
          <v-avatar color="info" variant="tonal" rounded="lg">
            <v-icon icon="mdi-table-large" />
          </v-avatar>
          <div>
            <v-card-title>Operational Records</v-card-title>
            <v-card-subtitle>Search, sort, and paginate filtered records</v-card-subtitle>
          </div>
        </div>

        <div class="records-actions">
          <v-text-field
            v-model="search"
            label="Search records"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            class="search-field"
          />

          <v-btn
            variant="outlined"
            color="primary"
            prepend-icon="mdi-download-outline"
            @click="exportOperationalRecordsCsv(sortedRecords)"
          >
            Export CSV
          </v-btn>
        </div>
      </div>

      <v-table class="records-table" density="comfortable">
        <caption class="visually-hidden">
          Operational records. Use the column header buttons to change the sort order.
        </caption>
        <thead>
          <tr>
            <th
              v-for="header in tableHeaders"
              :key="header.key"
              :class="{ 'text-right': header.align === 'end' }"
              scope="col"
              :aria-sort="ariaSort(header.key)"
            >
              <button class="sort-button" type="button" @click="setSort(header.key)">
                <span>{{ header.title }}</span>
                <v-icon :icon="sortIcon(header.key)" size="16" />
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="isInitialLoading">
            <td :colspan="tableHeaders.length">
              <v-progress-linear indeterminate color="primary" />
            </td>
          </tr>

          <tr v-else-if="paginatedRecords.length === 0">
            <td :colspan="tableHeaders.length" class="empty-state">
              <v-icon icon="mdi-database-search-outline" size="28" class="mb-2" />
              <div>No operational records match the current filters.</div>
            </td>
          </tr>

          <template v-else>
            <tr v-for="record in paginatedRecords" :key="record.id">
              <td>{{ record.date }}</td>
              <td>{{ record.businessUnit }}</td>
              <td>{{ record.region }}</td>
              <td class="text-right numeric">{{ currencyFormatter.format(record.revenue) }}</td>
              <td class="text-right numeric">{{ numberFormatter.format(record.transactions) }}</td>
              <td>
                <v-chip
                  :color="statusColor(record.status)"
                  size="small"
                  variant="tonal"
                  density="comfortable"
                >
                  <v-icon icon="mdi-circle-small" start />
                  {{ record.status }}
                </v-chip>
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>

      <div class="pagination-bar">
        <span class="results-count">
          Showing {{ paginatedRecords.length }} of {{ sortedRecords.length }} records
        </span>

        <div class="pagination-controls">
          <v-select
            v-model="itemsPerPage"
            :items="[5, 8, 12]"
            label="Rows"
            variant="outlined"
            density="compact"
            hide-details
            class="rows-select"
          />
          <v-pagination
            v-model="page"
            :length="pageCount"
            :total-visible="5"
            density="comfortable"
          />
        </div>
      </div>
    </v-card>
  </section>
</template>

<style scoped>
.dashboard-card :deep(.v-card-item) {
  padding-bottom: 0.25rem;
}

.dashboard-card :deep(.v-card-title) {
  font-size: 1.05rem;
  font-weight: 700;
  color: #101323;
}

.dashboard-card :deep(.v-card-subtitle) {
  color: #6b7280;
  opacity: 1;
}

.records-card:hover {
  transform: none;
}

.records-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.25rem 1.25rem 0.75rem;
}

.records-heading {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.records-heading :deep(.v-card-title),
.records-heading :deep(.v-card-subtitle) {
  padding: 0;
}

.records-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.search-field {
  min-width: 220px;
  max-width: 280px;
}

.records-table {
  border-top: 1px solid #eef1f8;
}

.records-table :deep(thead th) {
  background: #f8f9fd;
  color: #64748b !important;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.records-table :deep(tbody tr:hover) {
  background: #f8f9ff;
}

.numeric {
  font-weight: 600;
  color: #1f2937;
}

.sort-button {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.empty-state {
  padding: 2.5rem;
  color: #64748b;
  text-align: center;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
  border-top: 1px solid #eef1f8;
}

.results-count {
  color: #6b7280;
  font-size: 0.85rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rows-select {
  width: 104px;
}

@media (max-width: 960px) {
  .records-toolbar,
  .pagination-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .records-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-field {
    max-width: none;
  }

  .pagination-controls {
    justify-content: space-between;
  }
}
</style>
