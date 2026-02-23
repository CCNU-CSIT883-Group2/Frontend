<template>
  <!-- 导航/操作按钮：鼠标悬停或路由匹配时高亮背景 -->
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

/**
 * Props 说明：
 * - icon：PrimeIcons 图标名（不含 "pi-" 前缀），如 "pencil"、"chart-bar"
 * - to：目标路由名称（ROUTE_NAMES 中的值）；为空时按钮仅触发 click 事件，不跳转
 * - size：图标字体大小（rem 单位），默认 1rem
 * - iconDefaultClass：默认状态下的图标颜色 class
 * - iconHoverClass：悬停或路由匹配时的图标颜色 class
 */
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

// 绑定 button 元素引用，useElementHover 监听其悬停状态
const button = ref<HTMLElement | null>(null)
/** 按钮是否处于鼠标悬停状态 */
const isHovered = useElementHover(button)

const router = useRouter()
const route = useRoute()

/** 点击时跳转到目标路由；若 to 为空则不执行任何路由操作 */
const goToTargetPage = () => {
  if (!to) return
  void router.push({ name: to })
}

/** 当前路由是否与按钮的目标路由匹配（用于高亮当前页对应的导航按钮） */
const isRouterMatched = computed(() => route.name === to)
</script>
