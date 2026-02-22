<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
    <Card>
      <template #title>Accuracy Trend</template>
      <template #content>
        <Chart type="line" :data="lineChartData" :options="lineChartOptions" class="h-96" />
      </template>
    </Card>

    <Card>
      <template #title>Attempt Distribution</template>
      <template #content>
        <Chart type="pie" :data="pieChartData" :options="pieChartOptions" class="h-96" />
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'

defineProps<{
  lineChartData: ChartData<'line'>
  lineChartOptions: ChartOptions<'line'>
  pieChartData: ChartData<'pie', number[], string>
  pieChartOptions: ChartOptions<'pie'>
}>()
</script>
