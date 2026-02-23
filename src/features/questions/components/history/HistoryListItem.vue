<template>
  <div
    class="flex items-center justify-between rounded-md px-4 transition-all py-1.5"
    :class="itemClasses"
  >
    <div class="flex flex-col gap-0.5 h-full justify-center">
      <b class="dark:text-surface-300 select-none" :class="titleClasses">
        {{ tag }}
      </b>
      <div
        class="h-4 w-fit rounded px-2.5 py-0.5 flex items-center font-light text-xsm dark:text-surface-300"
        :class="subtitleClasses"
      >
        <span v-tooltip="title" class="select-none">
          {{ previewTitle }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-1">
      <div
        class="h-4 w-fit px-2.5 flex items-center font-light text-xsm dark:text-surface-300"
        :class="dateClasses"
      >
        <span class="select-none">{{ formattedDate }}</span>
      </div>
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
  title: string
  tag: string
  date: Date
  progress?: number
  isSelected?: boolean
}

const props = withDefaults(defineProps<HistoryListItemProps>(), {
  progress: 0,
  isSelected: false,
})

const formattedDate = useDateFormat(() => props.date, 'MMM DD', { locales: 'en-US' })

const previewTitle = computed(() =>
  props.title.length > 15 ? `${props.title.slice(0, 15)}...` : props.title,
)

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
