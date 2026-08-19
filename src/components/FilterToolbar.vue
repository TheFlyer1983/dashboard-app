<script setup lang="ts">
import { computed } from 'vue'

import type { DashboardFilters, RecordStatus, Region } from '@/types/analytics'

const props = defineProps<{
  filters: DashboardFilters
  availableRegions: Region[]
  availableStatuses: RecordStatus[]
  allRegions: DashboardFilters['region']
  allStatuses: DashboardFilters['status']
}>()

const emit = defineEmits<{
  updateFilters: [filters: Partial<DashboardFilters>]
  reset: []
}>()

const regionFilterItems = computed(() => [props.allRegions, ...props.availableRegions])

const statusFilterItems = computed(() => [props.allStatuses, ...props.availableStatuses])

const activeFilterChips = computed(() => {
  const chips: { key: keyof DashboardFilters; label: string }[] = []

  if (props.filters.region !== props.allRegions) {
    chips.push({ key: 'region', label: `Region: ${props.filters.region}` })
  }

  if (props.filters.status !== props.allStatuses) {
    chips.push({ key: 'status', label: `Status: ${props.filters.status}` })
  }

  if (props.filters.startDate) {
    chips.push({ key: 'startDate', label: `From ${props.filters.startDate}` })
  }

  if (props.filters.endDate) {
    chips.push({ key: 'endDate', label: `To ${props.filters.endDate}` })
  }

  return chips
})

function setStartDate(value: unknown): void {
  emit('updateFilters', {
    startDate: typeof value === 'string' ? value : '',
  })
}

function setEndDate(value: unknown): void {
  emit('updateFilters', {
    endDate: typeof value === 'string' ? value : '',
  })
}

function setRegion(value: unknown): void {
  emit('updateFilters', {
    region: (typeof value === 'string' ? value : props.allRegions) as DashboardFilters['region'],
  })
}

function setStatus(value: unknown): void {
  emit('updateFilters', {
    status: (typeof value === 'string' ? value : props.allStatuses) as DashboardFilters['status'],
  })
}

function clearFilterChip(key: keyof DashboardFilters): void {
  if (key === 'region') {
    setRegion(props.allRegions)
  } else if (key === 'status') {
    setStatus(props.allStatuses)
  } else if (key === 'startDate') {
    setStartDate('')
  } else if (key === 'endDate') {
    setEndDate('')
  }
}
</script>

<template>
  <v-card class="filter-toolbar" elevation="0">
    <div class="filter-toolbar-row">
      <div class="filter-field">
        <v-icon icon="mdi-calendar-range" size="18" />
        <v-text-field
          label="Start date"
          type="date"
          :model-value="filters.startDate"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="setStartDate"
        />
      </div>

      <div class="filter-field">
        <v-text-field
          label="End date"
          type="date"
          :model-value="filters.endDate"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="setEndDate"
        />
      </div>

      <div class="filter-field">
        <v-icon icon="mdi-earth" size="18" />
        <v-select
          label="Region"
          :items="regionFilterItems"
          :model-value="filters.region"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="setRegion"
        />
      </div>

      <div class="filter-field">
        <v-icon icon="mdi-pulse" size="18" />
        <v-select
          label="Status"
          :items="statusFilterItems"
          :model-value="filters.status"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="setStatus"
        />
      </div>

      <v-spacer />

      <v-btn
        variant="text"
        color="primary"
        prepend-icon="mdi-filter-remove-outline"
        @click="emit('reset')"
      >
        Reset
      </v-btn>
    </div>

    <div v-if="activeFilterChips.length > 0" class="filter-chip-row">
      <v-chip
        v-for="chip in activeFilterChips"
        :key="chip.key"
        size="small"
        closable
        variant="tonal"
        color="primary"
        @click:close="clearFilterChip(chip.key)"
      >
        {{ chip.label }}
      </v-chip>
    </div>
  </v-card>
</template>

<style scoped>
.filter-toolbar {
  border-radius: 18px;
  border: 1px solid #e6e9f2;
  padding: 1.1rem 1.25rem;
  background: #ffffff;
}

.filter-toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.filter-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 168px;
  flex: 1 1 168px;
}

.filter-field > .v-icon {
  color: #64748b;
}

.filter-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px dashed #e6e9f2;
}
</style>
