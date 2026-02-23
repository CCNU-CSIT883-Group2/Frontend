<template>
  <!-- 历史记录列表项：左侧标签/学科，右侧日期/进度圆环 -->
  <div
    class="flex items-center justify-between rounded-md px-4 transition-all py-1.5"
    :class="itemClasses"
  >
    <!-- 左侧：标签（粗体）+ 学科（小号背景胶囊，超长时截断） -->
    <div class="flex flex-col gap-0.5 h-full justify-center">
      <b class="dark:text-surface-300 select-none" :class="titleClasses">
        {{ tag }}
      </b>
      <!-- v-tooltip 在悬停时显示完整学科名（学科超过 15 字符时被截断显示） -->
      <div
        class="h-4 w-fit rounded px-2.5 py-0.5 flex items-center font-light text-xsm dark:text-surface-300"
        :class="subtitleClasses"
      >
        <span v-tooltip="title" class="select-none">
          {{ previewTitle }}
        </span>
      </div>
    </div>

    <!-- 右侧：创建日期 + 进度圆环 -->
    <div class="flex items-center gap-1">
      <!-- 格式化日期（如 "Jan 15"） -->
      <div
        class="h-4 w-fit px-2.5 flex items-center font-light text-xsm dark:text-surface-300"
        :class="dateClasses"
      >
        <span class="select-none">{{ formattedDate }}</span>
      </div>
      <!-- 进度圆环：progress [0, 1] 映射为百分比，完成时变为绿色 -->
      <CircleProgressBar :percentage="progress * 100" :size="24" :stroke-width="5" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 questions 领域的界面展示与交互行为（组件：HistoryListItem）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import CircleProgressBar from '@/features/questions/components/history/CircleProgressBar.vue'
import { useDateFormat } from '@vueuse/core'
import { computed } from 'vue'

interface HistoryListItemProps {
  /** 题集学科名称（完整，超长时会在模板中截断显示） */
  title: string
  /** 标签/知识点 */
  tag: string
  /** 创建时间（Date 对象） */
  date: Date
  /** 完成进度（0-1，1 表示已全部完成） */
  progress?: number
  /** 是否为当前选中项 */
  isSelected?: boolean
}

const props = withDefaults(defineProps<HistoryListItemProps>(), {
  progress: 0,
  isSelected: false,
})

/** 使用 VueUse useDateFormat 格式化日期（如 "Jan 15"） */
const formattedDate = useDateFormat(() => props.date, 'MMM DD', { locales: 'en-US' })

/**
 * 学科名称预览：超过 15 个字符时截断并加省略号。
 * 完整名称通过 v-tooltip 在悬停时展示。
 */
const previewTitle = computed(() =>
  props.title.length > 15 ? `${props.title.slice(0, 15)}...` : props.title,
)

/**
 * 以下 computed 均根据 isSelected 计算对应的 Tailwind CSS 类名：
 * - 选中状态：深色背景（black/dark gray）+ 浅色文字
 * - 未选中状态：悬停时轻灰背景
 */
const itemClasses = computed(() => ({
  'hover:bg-surface-200 dark:hover:bg-surface-600': !props.isSelected,
  'bg-surface-950 dark:bg-surface-700': props.isSelected,
}))

const titleClasses = computed(() => ({
  'text-surface-0': props.isSelected,
  'text-surface-950': !props.isSelected,
}))

const subtitleClasses = computed(() => ({
  'text-surface-0 bg-surface-800 dark:bg-surface-600': props.isSelected,
  'bg-surface-200 dark:bg-surface-700': !props.isSelected,
}))

const dateClasses = computed(() => ({
  'text-surface-0': props.isSelected,
}))
</script>
