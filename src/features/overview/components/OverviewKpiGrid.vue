<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    <article
      v-for="card in cards"
      :key="card.id"
      class="border-color rounded-2xl bg-surface-0 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-surface-900"
    >
      <div
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg"
        :class="iconToneClass(card.tone)"
      >
        <i :class="card.icon" class="text-sm" />
      </div>
      <p
        class="mt-3 text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-300"
      >
        {{ card.label }}
      </p>
      <p class="mt-2 text-2xl font-semibold text-surface-900 dark:text-surface-0">
        {{ card.value }}
      </p>
      <p class="mt-1 text-sm text-surface-500 dark:text-surface-300">{{ card.helper }}</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { OverviewKpiCard } from '@/features/overview/composables/overviewStatistics.presentation'

defineProps<{
  cards: OverviewKpiCard[]
}>()

const iconToneClass = (tone: OverviewKpiCard['tone']) => {
  if (tone === 'positive') {
    return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
  }

  if (tone === 'warning') {
    return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
  }

  return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
}
</script>
