<template>
  <div class="m-3 flex w-full min-h-0 flex-1 flex-col gap-2">
    <Toast />

    <div :class="['w-full flex min-h-0 flex-1 relative', isSidebarCollapsed ? 'lg:gap-0' : 'lg:gap-2']">
      <div
        v-if="!isSidebarCollapsed"
        class="absolute inset-y-0 right-0 left-16 z-20 backdrop-blur-md lg:hidden"
        aria-hidden="true"
        @click="toggleSidebar"
      />

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

      <div class="relative flex-1 min-h-0 min-w-0 pl-20 lg:pl-0">
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

const selectedHistoryId = ref(-1)
const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style scoped>
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

.question-panel-switch-leave-active {
  position: absolute;
  inset: 0;
}

@media (prefers-reduced-motion: reduce) {
  .question-panel-switch-enter-active,
  .question-panel-switch-leave-active {
    transition: none;
  }
}
</style>
