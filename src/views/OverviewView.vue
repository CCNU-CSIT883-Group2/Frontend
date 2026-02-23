<template>
  <!-- 页面容器，用于检测滚动位置以控制顶部工具栏阴影 -->
  <div ref="pageRef" class="m-3 w-full flex-1">
    <!--
      粘性工具栏：固定在 top-14（AppHeaderBar 高度）以下，
      随页面滚动产生阴影，让用户感知内容在工具栏下方滚动。
    -->
    <div
      :class="[
        'fixed left-0 right-0 top-14 z-20 border-b border-surface-200 bg-surface-0/95 backdrop-blur-sm transition-shadow duration-200 dark:border-surface-700 dark:bg-surface-950/95',
        hasScrolled
          ? 'shadow-[0_10px_16px_-14px_rgba(15,23,42,0.55)] dark:shadow-[0_10px_16px_-14px_rgba(2,6,23,0.9)]'
          : '',
      ]"
    >
      <div class="mx-3 px-1 py-2">
        <!-- 工具栏：学科切换 + 日期范围标签 + 分享按钮 -->
        <OverviewToolbar
          v-model="selectedSubject"
          :subjects="subjects"
          :date-range-label="dateRangeLabel"
          @share="shareCurrentStatistics"
        />
      </div>
    </div>

    <!-- 主内容区：top padding 留出工具栏高度 -->
    <section class="flex w-full flex-col gap-4 pt-24 pb-3 lg:pt-24 lg:pb-3">
      <!-- 错误状态：加载失败时显示错误消息 -->
      <Message v-if="!isLoading && errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <!-- 空数据状态：无学科时引导用户先做题 -->
      <Message v-else-if="!isLoading && !hasSubjectOptions" severity="info" :closable="false">
        No subjects found. Start a quiz first to generate statistics.
      </Message>

      <!-- 加载状态：使用骨架屏占位，避免布局抖动 -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Skeleton height="7rem" />
        <Skeleton height="7rem" />
        <Skeleton height="7rem" />
        <Skeleton height="7rem" />
        <Skeleton height="24rem" class="xl:col-span-2" />
        <Skeleton height="19rem" />
      </div>

      <!-- 仪表盘面板：有学科数据时渲染，传入所有图表和 KPI 数据 -->
      <OverviewDashboardPanel
        v-else-if="hasSubjectOptions"
        :kpi-cards="kpiCards"
        :insights="insights"
        :is-tag-view="isTagView"
        :selected-tag="selectedTag"
        :tags="tags"
        :weekly-goal-target="weeklyGoalTarget"
        :weekly-goal-completed="weeklyGoalCompleted"
        :weekly-goal-progress="weeklyGoalProgress"
        :latest-updated-label="latestUpdatedLabel"
        :accuracy-trend-chart-data="accuracyTrendChartData"
        :accuracy-trend-chart-options="accuracyTrendChartOptions"
        :attempts-stacked-chart-data="attemptsStackedChartData"
        :attempts-stacked-chart-options="attemptsStackedChartOptions"
        :subject-accuracy-chart-data="subjectAccuracyChartData"
        :subject-accuracy-chart-options="subjectAccuracyChartOptions"
        :distribution-chart-data="distributionChartData"
        :distribution-chart-options="distributionChartOptions"
        @update:selected-tag="handleTagChange"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「路由视图组件」。
 * - 负责页面级编排，组合子组件并衔接路由上下文（模块：OverviewView）。
 *
 * 设计原因（为什么）：
 * - 将页面容器职责与可复用业务组件分离，便于扩展页面能力与路由演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import OverviewDashboardPanel from '@/features/overview/components/OverviewDashboardPanel.vue'
import OverviewToolbar from '@/features/overview/components/OverviewToolbar.vue'
import { useOverviewStatistics } from '@/features/overview/composables/useOverviewStatistics'
import { useScroll } from '@vueuse/core'
import { computed, onMounted, ref, shallowRef } from 'vue'

// 从 composable 获取所有统计数据和操作方法
const {
  selectedSubject,
  subjects,
  selectedTag,
  tags,
  isTagView,
  hasSubjectOptions,
  isLoading,
  errorMessage,
  dateRangeLabel,
  latestUpdatedLabel,
  kpiCards,
  insights,
  weeklyGoalTarget,
  weeklyGoalCompleted,
  weeklyGoalProgress,
  accuracyTrendChartData,
  accuracyTrendChartOptions,
  attemptsStackedChartData,
  attemptsStackedChartOptions,
  subjectAccuracyChartData,
  subjectAccuracyChartOptions,
  distributionChartData,
  distributionChartOptions,
  shareCurrentStatistics,
} = useOverviewStatistics()

/** 处理子组件发出的标签切换事件，写入 composable 中的 selectedTag */
const handleTagChange = (nextTag: string) => {
  selectedTag.value = nextTag
}

/** 页面容器引用，用于向上查找实际滚动容器 */
const pageRef = ref<HTMLElement | null>(null)
/** 实际滚动容器（可能是祖先元素或 window） */
const scrollTarget = shallowRef<HTMLElement | Window>(window)

// 监听滚动位置，y > 0 时为工具栏添加阴影
const { y } = useScroll(scrollTarget)
const hasScrolled = computed(() => y.value > 0)

/**
 * 检测元素是否为可滚动容器（overflow-y 为 auto/scroll/overlay）。
 */
const isScrollableElement = (element: HTMLElement) => {
  const { overflowY } = window.getComputedStyle(element)
  return /(auto|scroll|overlay)/.test(overflowY)
}

/**
 * 从给定元素向上遍历 DOM 树，找到第一个可滚动的祖先元素。
 * 找不到时返回 null（回退到 window）。
 */
const resolveScrollContainer = (start: HTMLElement | null) => {
  let current = start?.parentElement ?? null

  while (current) {
    if (isScrollableElement(current)) {
      return current
    }
    current = current.parentElement
  }

  return null
}

/**
 * 组件挂载后解析实际滚动容器。
 * 在 AppHeaderBar 使用固定布局时，页面内容可能在某个 div 中滚动，
 * 需要动态查找而非硬编码 window。
 */
onMounted(() => {
  scrollTarget.value = resolveScrollContainer(pageRef.value) ?? window
})
</script>
