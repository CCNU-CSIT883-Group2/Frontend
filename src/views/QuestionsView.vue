<template>
  <!-- 页面容器：flex 布局，撑满高度，留出间距 -->
  <div class="m-3 flex w-full min-h-0 flex-1 flex-col gap-2">
    <!-- 全局 Toast 通知（用于显示提交成功/失败等消息） -->
    <Toast />

    <!-- 主内容区：侧边栏 + 右侧面板 -->
    <div :class="['w-full flex min-h-0 flex-1 relative', isSidebarCollapsed ? 'lg:gap-0' : 'lg:gap-2']">
      <!--
        移动端遮罩层：侧边栏展开时显示，点击遮罩可关闭侧边栏。
        大屏（lg）时隐藏（侧边栏不覆盖内容）。
      -->
      <div
        v-if="!isSidebarCollapsed"
        class="absolute inset-y-0 right-0 left-16 z-20 backdrop-blur-md lg:hidden"
        aria-hidden="true"
        @click="toggleSidebar"
      />

      <!--
        侧边栏容器：
        - 移动端：绝对定位，展开时宽度为视口 85% 或 22rem 取小；折叠时宽 16px。
        - 大屏（lg）：相对定位，参与文档流。
      -->
      <div
        :class="[
          'transition-[width] duration-200 overflow-hidden shrink-0 z-30',
          'absolute left-0 top-0 bottom-0 lg:relative lg:top-auto lg:left-auto lg:bottom-auto',
          isSidebarCollapsed ? 'w-16' : 'w-[min(22rem,85vw)] lg:w-72',
        ]"
      >
        <QuestionSidebar
          v-model:selected="selectedHistoryId"
          :collapsed="isSidebarCollapsed"
          :class="['w-full h-full min-h-0 lg:min-h-0', isSidebarCollapsed ? 'lg:min-h-0' : 'lg:min-h-[16rem]']"
          @toggle-collapse="toggleSidebar"
        />
      </div>

      <!--
        右侧面板：
        - pl-20 为移动端侧边栏预留空间（折叠状态下的 16px + 间距）。
        - 大屏时 pl-0（侧边栏在文档流中，无需预留）。
      -->
      <div class="relative flex-1 min-h-0 min-w-0 pl-20 lg:pl-0">
        <!--
          面板切换过渡动画（淡入 + 向上滑动）：
          - 选中题集（selectedHistoryId !== -1）时显示 AnswerPanel；
          - 否则显示 QuestionCreatePanel。
          - :key 确保切换题集时重新挂载 AnswerPanel，触发新的数据请求。
        -->
        <Transition name="question-panel-switch">
          <AnswerPanel
            v-if="selectedHistoryId !== -1"
            :key="selectedHistoryId"
            :history-id="selectedHistoryId"
            class="h-full min-h-0 min-w-0"
          />
          <QuestionCreatePanel v-else key="create-panel" class="h-full min-h-0 min-w-0" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「路由视图组件」。
 * - 负责页面级编排，组合子组件并衔接路由上下文（模块：QuestionsView）。
 *
 * 设计原因（为什么）：
 * - 将页面容器职责与可复用业务组件分离，便于扩展页面能力与路由演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import AnswerPanel from '@/features/questions/components/AnswerPanel.vue'
import QuestionCreatePanel from '@/features/questions/components/QuestionCreatePanel.vue'
import QuestionSidebar from '@/features/questions/components/QuestionSidebar.vue'
import { ref } from 'vue'

/** 当前选中的题集 ID（-1 表示未选中，显示创建面板） */
const selectedHistoryId = ref(-1)
/** 侧边栏是否处于折叠状态 */
const isSidebarCollapsed = ref(false)

/** 切换侧边栏折叠状态 */
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style scoped>
/* 面板切换过渡：淡入 + 向上滑动 6px */
.question-panel-switch-enter-active,
.question-panel-switch-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.question-panel-switch-enter-from,
.question-panel-switch-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* 离开时绝对定位，避免占据布局空间导致内容跳动 */
.question-panel-switch-leave-active {
  position: absolute;
  inset: 0;
}

/* 用户偏好减弱动效：完全禁用过渡 */
@media (prefers-reduced-motion: reduce) {
  .question-panel-switch-enter-active,
  .question-panel-switch-leave-active {
    transition: none;
  }
}
</style>
