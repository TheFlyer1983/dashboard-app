<script setup lang="ts">
import { computed } from 'vue'

import { timeFormatter } from '@/utils/formatters'

const props = defineProps<{
  loading: boolean
  lastUpdatedAt: Date | null
}>()

const emit = defineEmits<{
  toggleSidebar: []
  refresh: []
}>()

const lastUpdatedLabel = computed(() =>
  props.lastUpdatedAt ? `Updated ${timeFormatter.format(props.lastUpdatedAt)}` : 'Loading data…',
)
</script>

<template>
  <v-app-bar color="surface" elevation="0" height="76" class="app-topbar">
    <v-btn
      icon="mdi-menu"
      variant="text"
      aria-label="Toggle navigation"
      @click="emit('toggleSidebar')"
    />

    <div class="topbar-heading">
      <p class="eyebrow">Dashboard</p>
      <h1>Business Operations</h1>
    </div>

    <v-spacer />

    <div class="topbar-actions">
      <span class="last-updated" role="status" aria-live="polite">
        <v-icon icon="mdi-clock-outline" size="14" />
        {{ lastUpdatedLabel }}
      </span>

      <v-btn
        icon="mdi-refresh"
        variant="tonal"
        color="primary"
        :loading="loading"
        aria-label="Refresh data"
        @click="emit('refresh')"
      />

      <v-divider vertical class="topbar-divider" />

      <v-avatar color="primary" variant="tonal" size="40">
        <v-icon icon="mdi-account-tie-outline" />
      </v-avatar>
    </div>
  </v-app-bar>
</template>

<style scoped>
.app-topbar {
  border-bottom: 1px solid #e6e9f2;
}

.app-topbar :deep(.v-toolbar__content) {
  padding-inline: 1.25rem;
  gap: 0.5rem;
}

.topbar-heading {
  margin-left: 0.5rem;
}

.topbar-heading h1 {
  margin: 0;
  color: #101323;
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.2;
}

.eyebrow {
  margin: 0 0 0.15rem;
  color: #6b7280;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.last-updated {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.topbar-divider {
  height: 28px;
}
</style>
