<template>
  <!-- 顶部固定导航栏：左侧 Logo + 主导航；右侧工具按钮（深色模式、设置、个人资料） -->
  <div
    class="fixed inset-x-0 top-0 z-40 h-14 flex p-4 divide-x divide-solid bg-surface-100 dark:bg-surface-800 divide-surface-300 dark:divide-surface-600 border-b border-surface-200 dark:border-surface-500"
  >
    <!-- Logo 区域 -->
    <div class="flex justify-center flex-none">
      <i
        class="pi pi-prime text-surface-950 dark:text-surface-400 mr-3"
        style="font-size: 1.5rem"
      ></i>
    </div>

    <!-- 导航区域：左侧主导航 + 右侧工具操作 -->
    <div class="flex-1 flex justify-between">
      <!-- 主导航按钮组（题目、统计概览等） -->
      <div class="flex items-center gap-4 ml-3">
        <AppHeaderActionButton
          v-for="action in navigationActions"
          :key="action.to"
          :icon="action.icon"
          :to="action.to"
        />
      </div>

      <!-- 右侧工具按钮组 -->
      <div class="flex items-center gap-4 mr-3">
        <!-- 深色/浅色模式切换按钮：图标随当前模式动态切换 -->
        <AppHeaderActionButton
          :icon="darkMode ? 'sun' : 'moon'"
          @click="userSettingsStore.toggleDarkMode()"
        />
        <!-- 打开设置弹窗 -->
        <AppHeaderActionButton icon="cog" @click="isSettingsVisible = true" />
        <!-- 跳转到个人资料页 -->
        <AppHeaderActionButton :to="ROUTE_NAMES.profile" icon="users" />
      </div>

      <!-- 设置弹窗：修改深色模式、题目显示选项、AI 模型选择 -->
      <Dialog
        v-model:visible="isSettingsVisible"
        header="Settings"
        :modal="true"
        :style="{ width: '48rem', maxWidth: 'calc(100vw - 2rem)' }"
      >
        <p class="mb-4 text-sm text-surface-500 dark:text-surface-300">
          These options apply instantly to your current session.
        </p>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <!-- 深色模式开关 -->
          <div
            class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
          >
            <div>
              <div class="text-sm font-medium text-surface-800 dark:text-surface-100">
                Dark mode
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-300">
                Toggle application theme
              </div>
            </div>
            <ToggleSwitch
              :model-value="darkMode"
              @update:model-value="userSettingsStore.setDarkMode"
            />
          </div>

          <!-- 是否显示题目难度标签 -->
          <div
            class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
          >
            <div>
              <div class="text-sm font-medium text-surface-800 dark:text-surface-100">
                Show difficulty
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-300">
                Display question difficulty tags
              </div>
            </div>
            <ToggleSwitch v-model="settings.questions.showDifficulty" />
          </div>

          <!-- 是否显示建议用时 -->
          <div
            class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
          >
            <div>
              <div class="text-sm font-medium text-surface-800 dark:text-surface-100">
                Show time hint
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-300">
                Display estimated answer time
              </div>
            </div>
            <ToggleSwitch v-model="settings.questions.showTime" />
          </div>

          <!-- AI 出题模型选择（从后端动态加载） -->
          <div
            class="rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
          >
            <div class="mb-2 text-sm font-medium text-surface-800 dark:text-surface-100">
              Question model
            </div>
            <Select
              v-model="settings.questions.generateModel"
              :options="availableModels"
              option-label="label"
              option-value="value"
              :loading="isLoadingModels"
              placeholder="Select a model"
              class="w-full"
            />
          </div>
        </div>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 layout 领域的界面展示与交互行为（组件：AppHeaderBar）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import AppHeaderActionButton from '@/features/layout/components/AppHeaderActionButton.vue'
import { ROUTE_NAMES } from '@/router'
import { useUserSettingsStore } from '@/stores/userStore'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'

/** 主导航按钮配置（顺序即为显示顺序） */
const navigationActions = [
  { icon: 'pencil', to: ROUTE_NAMES.questions },   // 题目练习页
  { icon: 'chart-bar', to: ROUTE_NAMES.overview },  // 统计概览页
] as const

/** 设置弹窗的显示控制 */
const isSettingsVisible = ref(false)

const userSettingsStore = useUserSettingsStore()
// storeToRefs 解构：确保 settings/darkMode/availableModels 保持响应性
const { settings, darkMode, availableModels, isLoadingModels } = storeToRefs(userSettingsStore)

// 组件挂载时从后端加载可用 AI 模型列表（有缓存则跳过网络请求）
onMounted(() => {
  void userSettingsStore.loadAvailableModels()
})
</script>
