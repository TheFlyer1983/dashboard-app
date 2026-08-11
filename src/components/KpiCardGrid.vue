<script setup lang="ts">
import type { KpiCard } from "@/types/dashboard";
import type { TrendDirection } from "@/types/analytics";

defineProps<{
  cards: KpiCard[];
  loading: boolean;
  lastUpdatedAt: Date | null;
}>();

function trendIcon(direction: TrendDirection): string {
  if (direction === "up") return "mdi-trending-up";
  if (direction === "down") return "mdi-trending-down";
  return "mdi-trending-neutral";
}

function trendColor(direction: TrendDirection): string {
  if (direction === "up") return "success";
  if (direction === "down") return "error";
  return "grey-darken-1";
}
</script>

<template>
  <v-row class="mt-5">
    <v-col v-for="card in cards" :key="card.title" cols="12" sm="6" lg="3">
      <v-card v-if="loading && !lastUpdatedAt" class="kpi-card" elevation="0">
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
/* Cards */
.kpi-card,
.dashboard-card {
  border: 1px solid #e6e9f2;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.kpi-card:hover,
.dashboard-card:hover {
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.kpi-card {
  position: relative;
  overflow: hidden;
  height: 100%;
}

.kpi-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--v-theme-primary, #4f46e5);
}

.kpi-card--primary::before {
  background: #4f46e5;
}

.kpi-card--secondary::before {
  background: #0f766e;
}

.kpi-card--info::before {
  background: #0284c7;
}

.kpi-card--success::before {
  background: #16a34a;
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
  color: #94a3b8;
  font-size: 0.78rem;
}
</style>
