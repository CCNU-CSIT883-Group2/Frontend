<template>
  <div class="p-4 md:p-6 flex flex-col gap-4">
    <OverviewToolbar
      v-model="selectedSubject"
      :subjects="subjects"
      @share="shareCurrentStatistics"
    />

    <Message v-if="!hasSubjectOptions" severity="info" :closable="false">
      No subjects found. Start a quiz first to generate statistics.
    </Message>

    <Message v-else-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <div v-if="isLoading" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Skeleton height="24rem" />
      <Skeleton height="24rem" />
    </div>

    <OverviewChartsPanel
      v-else-if="hasSubjectOptions"
      :line-chart-data="lineChartData"
      :line-chart-options="lineChartOptions"
      :pie-chart-data="pieChartData"
      :pie-chart-options="pieChartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import OverviewChartsPanel from '@/components/overview/OverviewChartsPanel.vue'
import OverviewToolbar from '@/components/overview/OverviewToolbar.vue'
import { useOverviewStatistics } from '@/composables/useOverviewStatistics'

const {
  selectedSubject,
  subjects,
  hasSubjectOptions,
  isLoading,
  errorMessage,
  lineChartData,
  lineChartOptions,
  pieChartData,
  pieChartOptions,
  shareCurrentStatistics,
} = useOverviewStatistics()
</script>
