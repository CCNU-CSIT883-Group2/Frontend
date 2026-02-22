<template>
  <div
    :class="{
      'hover:bg-surface-200 dark:hover:bg-surface-600': !selected,
      'bg-surface-950 dark:bg-surface-700': selected,
    }"
    class="flex items-center justify-between rounded-md px-4 transition-all py-1.5"
  >
    <div class="flex flex-col gap-0.5 h-full justify-center">
      <b
        :class="{
          'text-surface-0': selected,
          'text-surface-950': !selected,
        }"
        class="dark:text-surface-300 select-none"
      >
        {{ props.tag }}
      </b>
      <div
        :class="{
          'text-surface-0 bg-surface-800 dark:bg-surface-600': selected,
          'bg-surface-200 dark:bg-surface-700': !selected,
        }"
        class="h-4 w-fit rounded px-2.5 py-0.5 flex items-center font-light text-xsm dark:text-surface-300"
      >
        <span class="select-none" v-tooltip="props.title">
          {{ previewTitle }}
        </span>
      </div>
    </div>
    <div class="flex items-center gap-1">
      <div
        :class="{ 'text-surface-0': selected }"
        class="h-4 w-fit px-2.5 flex items-center font-light text-xsm dark:text-surface-300"
      >
        <span class="select-none">{{ date }}</span>
      </div>
      <circle-progress-bar :percentage="props.progress * 100" :size="24" :stroke-width="5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CircleProgressBar from '@/components/CircleProgressBar.vue'
import { useDateFormat } from '@vueuse/core'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    tag: string
    date: Date
    progress?: number
    selected?: boolean
  }>(),
  {
    progress: 0,
    selected: false,
  },
)

const date = useDateFormat(props.date, 'MMM DD', { locales: 'en-US' })
const previewTitle = computed(() =>
  props.title.length > 15 ? `${props.title.slice(0, 15)}...` : props.title,
)
</script>

<style scoped></style>
