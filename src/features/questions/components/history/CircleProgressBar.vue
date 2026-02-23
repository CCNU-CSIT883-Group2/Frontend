<template>
  <!-- SVG 圆形进度条：由两个 circle 叠加实现（背景轨道 + 前景进度） -->
  <svg
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    :width="size"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- 背景圆（轨道），不填充，仅描边 -->
    <circle
      :class="backgroundColorClass"
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      :stroke-width="strokeWidth"
      fill="none"
    />
    <!-- 前景圆（进度），通过 stroke-dasharray 和 stroke-dashoffset 控制进度弧长 -->
    <!-- transform rotate(-90) 使进度从 12 点方向开始顺时针绘制 -->
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
    /** 当前进度百分比（0-100） */
    percentage?: number
    /** SVG 尺寸（宽高相等，单位 px） */
    size?: number
    /** 进度弧的描边颜色（Tailwind stroke-* 类名） */
    color?: string
    /** 背景轨道的描边颜色 */
    backgroundColor?: string
    /** 深色模式下进度弧的颜色 */
    darkColor?: string
    /** 深色模式下背景轨道的颜色 */
    darkBackgroundColor?: string
    /** 进度 100% 时进度弧的颜色（如绿色，表示已完成） */
    finishColor?: string
    /** 深色模式下 100% 时的颜色 */
    darkFinishColor?: string
    /** 描边宽度（影响圆环粗细） */
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

/** 将百分比限制到 [0, 100] 范围 */
const normalizedPercentage = computed(() => Math.min(100, Math.max(0, props.percentage)))

/**
 * 圆的半径：等于 (size - strokeWidth) / 2。
 * 减去 strokeWidth 是为了确保描边不超出 SVG 边界（描边以路径为中心绘制）。
 */
const radius = computed(() => (props.size - props.strokeWidth) / 2)

/** 圆的周长（2πr），用于计算 stroke-dasharray */
const circumference = computed(() => 2 * Math.PI * radius.value)

/**
 * stroke-dashoffset 控制进度弧的起始偏移量：
 * - offset = circumference - (percentage / 100) * circumference
 * - offset = 0 时显示完整圆（100%）；
 * - offset = circumference 时显示空圆（0%）。
 */
const offset = computed(() => {
  return circumference.value - (normalizedPercentage.value / 100) * circumference.value
})

/**
 * 进度弧的颜色类：
 * - 100% 时使用 finishColor（如绿色），表示任务完成；
 * - 其他情况使用 color（默认灰色）。
 */
const colorClass = computed(() => {
  if (normalizedPercentage.value === 100) {
    return `${props.finishColor} dark:${props.darkFinishColor}`
  }
  return `${props.color} dark:${props.darkColor}`
})

/** 背景轨道颜色（始终固定，不随进度变化） */
const backgroundColorClass = computed(
  () => `${props.backgroundColor} dark:${props.darkBackgroundColor}`,
)
</script>

<style scoped>
/* 进度弧变化时应用平滑过渡动画（0.35s） */
circle {
  transition: stroke-dashoffset 0.35s;
}
</style>
