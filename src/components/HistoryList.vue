<template>
  <scroll-panel class="flex-1 p-0">
    <div class="flex flex-col gap-1">
      <question-list-item
        class="flex-1 h-16 mr-2.5"
        v-for="(h, i) in props.history"
        :key="i"
        :progress="h.progress"
        :selected="props.selected === i"
        :tag="h.tag"
        :title="h.subject"
        :date="h.createAt"
        @click="emit('update:selected', i)"
      />
    </div>
  </scroll-panel>
</template>

<script lang="ts" setup>
import QuestionListItem from '@/components/HistoryListItem.vue'
import type { History } from '@/types'

const props = defineProps<{
  history: Array<History>
  selected: number
}>()

const emit = defineEmits(['update:selected'])
</script>

<style scoped>
* {
  --p-scrollpanel-bar-size: 8px;
}
</style>
