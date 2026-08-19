<script setup lang="ts">
import type { KpiCard } from '@/types/dashboard'
import type { TrendDirection } from '@/types/analytics'

defineProps<{
  cards: KpiCard[]
  isInitialLoading: boolean
}>()

function trendIcon(direction: TrendDirection): string {
  if (direction === 'up') return 'mdi-trending-up'
  if (direction === 'down') return 'mdi-trending-down'
  return 'mdi-trending-neutral'
}

function trendColor(direction: TrendDirection): string {
  if (direction === 'up') return 'success'
  if (direction === 'down') return 'error'
  return 'grey-darken-1'
}
</script>

<template>
  <v-row class="mt-5">
    <v-col v-for="card in cards" :key="card.title" cols="12" sm="6" lg="3">
      <v-card v-if="isInitialLoading" class="kpi-card" elevation="0">
        <v-skeleton-loader type="avatar, article" class="kpi-skeleton" />
      </v-card>

      <v-card v-else :class="['kpi-card', `kpi-card--${card.color}`]" elevation="0">
        <div class="kpi-card-content">
          <v-avatar :color="card.color" variant="tonal" rounded="lg" size="48">
            <v-icon :icon="card.icon" size="22" />
          </v-avatar>

          <div class="kpi-text">
            <p>{{ card.title }}</p>
            <strong>{{ card.value }}</strong>
            <div class="kpi-meta">
              <v-chip
                v-if="card.trend"
                size="x-small"
                variant="tonal"
                :color="trendColor(card.trend.direction)"
                :prepend-icon="trendIcon(card.trend.direction)"
              >
                {{ Math.abs(card.trend.changePercent).toFixed(1) }}%
              </v-chip>
              <span>{{ card.subtitle }}</span>
            </div>
          </div>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.kpi-card {
  position: relative;
  overflow: hidden;
  height: 100%;
}

.kpi-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: rgb(var(--v-theme-primary));
}

.kpi-card--primary::before {
  background: rgb(var(--v-theme-primary));
}

.kpi-card--secondary::before {
  background: rgb(var(--v-theme-secondary));
}

.kpi-card--info::before {
  background: rgb(var(--v-theme-info));
}

.kpi-card--success::before {
  background: rgb(var(--v-theme-success));
}

.kpi-skeleton {
  padding: 1.25rem;
}

.kpi-card-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.35rem;
}

.kpi-text p {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
}

.kpi-text strong {
  display: block;
  margin-top: 0.25rem;
  color: #0f172a;
  font-size: 1.65rem;
  font-weight: 700;
  line-height: 1.2;
}

.kpi-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.kpi-meta span {
  color: #64748b;
  font-size: 0.78rem;
}
</style>
