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
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 layout 领域的界面展示与交互行为（组件：AppHeaderActionButton）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

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
