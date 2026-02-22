<template>
  <Button
    ref="button"
    :class="{
      ['border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700']:
        isHovered || isRouterMatched,
    }"
    class="border border-transparent rounded-md w-9 h-9 flex justify-center items-center transition-all"
    unstyled
    @click="goToTargetPage"
  >
    <i
      :class="{
        [iconDefaultClass]: !isHovered && !isRouterMatched,
        [iconHoverClass]: isHovered || isRouterMatched,
        [`pi pi-${icon}`]: true,
      }"
      :style="{ fontSize: `${size}rem` }"
    />
  </Button>
</template>

<script setup lang="ts">
import { useElementHover } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const {
  icon = '',
  to = '',
  size = 1,
  iconDefaultClass = 'text-surface-900 dark:text-surface-500',
  iconHoverClass = 'text-surface-500 dark:text-surface-400',
} = defineProps<{
  icon?: string
  to?: string
  size?: number
  iconDefaultClass?: string
  iconHoverClass?: string
}>()

const button = ref<HTMLElement | null>(null)
const isHovered = useElementHover(button)

const router = useRouter()
const route = useRoute()

const goToTargetPage = () => {
  if (!to) return
  void router.push({ name: to })
}

const isRouterMatched = computed(() => route.name === to)
</script>
