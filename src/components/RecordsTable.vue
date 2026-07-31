<script setup lang="ts">
import { ref, computed } from "vue";
import type { OperationalRecord } from "@/types/analytics";
import type { SortableKey, SortDirection, TableHeader} from "@/types/dashboard"

const props = defineProps<{
  records: OperationalRecord[];
  loading: boolean;
  lastUpdatedAt: Date | null;
}>();

const search = ref<string | null>(null);
const page = ref(1)
const itemsPerPage = ref(8)
const sortKey = ref<SortableKey>('date')
const sortDirection = ref<SortDirection>('desc')

const tableHeaders: TableHeader[] = [
  { title: 'Date', key: 'date' },
  { title: 'Business Unit', key: 'businessUnit' },
  { title: 'Region', key: 'region' },
  { title: 'Revenue', key: 'revenue', align: 'end' },
  { title: 'Transactions', key: 'transactions', align: 'end' },
  { title: 'Status', key: 'status' },
]

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-GB')

const searchedRecords = computed(() => {
  const query = search.value?.trim().toLowerCase()

  if (!query) {
    return props.records
  }

  return props.records.filter((record) =>
    [
      record.date,
      record.businessUnit,
      record.region,
      record.status,
      record.revenue.toString(),
      record.transactions.toString(),
    ]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
})

const sortedRecords = computed(() => {
  const direction = sortDirection.value === 'asc' ? 1 : -1

  return [...searchedRecords.value].sort((firstRecord, secondRecord) => {
    const firstValue = firstRecord[sortKey.value]
    const secondValue = secondRecord[sortKey.value]

    if (typeof firstValue === 'number' && typeof secondValue === 'number') {
      return (firstValue - secondValue) * direction
    }

    return String(firstValue).localeCompare(String(secondValue)) * direction
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(sortedRecords.value.length / itemsPerPage.value)))

const paginatedRecords = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return sortedRecords.value.slice(start, start + itemsPerPage.value)
})

function setSort(nextSortKey: SortableKey): void {
  if (sortKey.value === nextSortKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = nextSortKey
  sortDirection.value = 'asc'
}

function sortIcon(headerKey: SortableKey): string {
  if (sortKey.value !== headerKey) {
    return 'mdi-swap-vertical'
  }

  return sortDirection.value === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
}

function statusColor(status: OperationalRecord['status']): string {
  const colors: Record<OperationalRecord['status'], string> = {
    Healthy: 'success',
    Attention: 'warning',
    'At Risk': 'error',
  }

  return colors[status]
}

function exportCsv(): void {
  const header = ['Date', 'Business Unit', 'Region', 'Revenue', 'Transactions', 'Status']
  const rows = sortedRecords.value.map((record) => [
    record.date,
    record.businessUnit,
    record.region,
    record.revenue,
    record.transactions,
    record.status,
  ])

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `operational-records-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
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
            @click="exportCsv"
          >
            Export CSV
          </v-btn>
        </div>
      </div>

      <v-table class="records-table" density="comfortable">
        <thead>
          <tr>
            <th
              v-for="header in tableHeaders"
              :key="header.key"
              :class="{ 'text-right': header.align === 'end' }"
            >
              <button class="sort-button" type="button" @click="setSort(header.key)">
                <span>{{ header.title }}</span>
                <v-icon :icon="sortIcon(header.key)" size="16" />
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading && !lastUpdatedAt">
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
.records-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.25rem 1.25rem 0.75rem;
}

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
  color: #94a3b8;
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
  .dashboard-content {
    padding: 1.25rem 1rem 2.5rem;
  }

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
