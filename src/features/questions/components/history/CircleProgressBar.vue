<template>
  <svg
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    :width="size"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      :class="backgroundColorClass"
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      :stroke-width="strokeWidth"
      fill="none"
    />
    <circle
      :class="colorClass"
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="offset"
      :stroke-width="strokeWidth"
      :transform="`rotate(-90 ${size / 2} ${size / 2})`"
      fill="none"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 questions 领域的界面展示与交互行为（组件：CircleProgressBar）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    percentage?: number
    size?: number
    color?: string
    backgroundColor?: string
    darkColor?: string
    darkBackgroundColor?: string
    finishColor?: string
    darkFinishColor?: string
    strokeWidth?: number
  }>(),
  {
    percentage: 0,
    size: 100,
    color: 'stroke-surface-500',
    backgroundColor: 'stroke-surface-200',
    darkColor: 'stroke-surface-600',
    darkBackgroundColor: 'stroke-surface-800',
    finishColor: 'stroke-green-500',
    darkFinishColor: 'stroke-green-800',
    strokeWidth: 10,
  },
)

const normalizedPercentage = computed(() => Math.min(100, Math.max(0, props.percentage)))

const radius = computed(() => (props.size - props.strokeWidth) / 2)

const circumference = computed(() => 2 * Math.PI * radius.value)

const offset = computed(() => {
  return circumference.value - (normalizedPercentage.value / 100) * circumference.value
})

const colorClass = computed(() => {
  if (normalizedPercentage.value === 100) {
    return `${props.finishColor} dark:${props.darkFinishColor}`
  }
  return `${props.color} dark:${props.darkColor}`
})

const backgroundColorClass = computed(
  () => `${props.backgroundColor} dark:${props.darkBackgroundColor}`,
)
</script>

<style scoped>
circle {
  transition: stroke-dashoffset 0.35s;
}
</style>
