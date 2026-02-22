<template>
  <svg
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    :width="size"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- 背景圆圈 -->
    <circle
      :class="backgroundColorClass"
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      :stroke-width="strokeWidth"
      fill="none"
    />
    <!-- 前景圆圈（显示进度） -->
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

// 计算圆圈的半径
const radius = computed(() => (props.size - props.strokeWidth) / 2)

// 计算圆圈的周长
const circumference = computed(() => 2 * Math.PI * radius.value)

// 根据进度计算偏移量
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
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}
</style>
