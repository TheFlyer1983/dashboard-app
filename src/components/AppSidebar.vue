<script setup lang="ts">
import type { NavItem } from '@/types/dashboard'

defineProps<{
  temporary: boolean
  activeSection: string
  navItems: NavItem[]
}>()

const sidebarOpen = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  selectSection: [id: string]
}>()
</script>

<template>
  <v-navigation-drawer
    v-model="sidebarOpen"
    :temporary="temporary"
    :permanent="!temporary"
    width="256"
    class="app-sidebar"
  >
    <div class="brand">
      <v-avatar color="white" variant="flat" size="36" class="brand-mark">
        <v-icon icon="mdi-hexagon-multiple" color="primary" />
      </v-avatar>
      <div>
        <strong>OpsBoard</strong>
        <span>Operational Analytics</span>
      </div>
    </div>

    <v-list nav class="sidebar-nav">
      <v-list-item
        v-for="item in navItems"
        :key="item.id"
        :prepend-icon="item.icon"
        :title="item.label"
        :active="activeSection === item.id"
        :aria-current="activeSection === item.id ? 'location' : undefined"
        rounded="lg"
        class="sidebar-item"
        @click="emit('selectSection', item.id)"
      />
    </v-list>

    <template #append>
      <div class="sidebar-footer">
        <v-divider class="sidebar-divider" />
        <div class="sidebar-footer-row">
          <v-icon icon="mdi-database-outline" size="16" />
          <span>Mock REST API</span>
        </div>
        <div class="sidebar-footer-row muted">
          <span>v1.0.0</span>
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<style scoped>
.app-sidebar {
  background: linear-gradient(180deg, #1e1b4b 0%, #312e81 100%) !important;
  border: none !important;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.25rem 1rem;
}

.brand-mark {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.brand strong {
  display: block;
  color: #ffffff;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

.brand span {
  display: block;
  color: #a5b4fc;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sidebar-nav {
  padding: 0.5rem 0.75rem;
}

.sidebar-item {
  color: #c7d2fe !important;
  font-weight: 500;
  margin-bottom: 0.15rem;
}

.sidebar-item :deep(.v-list-item-title) {
  font-size: 0.92rem;
}

.sidebar-item.v-list-item--active {
  background: rgba(255, 255, 255, 0.14) !important;
  color: #ffffff !important;
}

.sidebar-item.v-list-item--active :deep(.v-icon) {
  color: #ffffff !important;
}

.sidebar-footer {
  padding: 0.75rem 1.25rem 1.25rem;
}

.sidebar-divider {
  border-color: rgba(255, 255, 255, 0.14) !important;
  margin-bottom: 0.75rem;
}

.sidebar-footer-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #c7d2fe;
  font-size: 0.78rem;
  font-weight: 600;
}

.sidebar-footer-row.muted {
  color: #818cf8;
  font-weight: 500;
  margin-top: 0.2rem;
}
</style>
