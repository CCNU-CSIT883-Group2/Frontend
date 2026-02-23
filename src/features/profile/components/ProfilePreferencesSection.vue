<template>
  <!-- 偏好设置卡片：圆角边框白色背景 -->
  <section
    class="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
  >
    <header class="mb-4">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Preferences</h2>
      <p class="text-sm text-surface-500 dark:text-surface-300">
        These options apply instantly to your current session.
      </p>
    </header>

    <!-- 2 列响应式网格，每项为内嵌圆角卡片 -->
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <!-- 深色模式开关：通过 userSettingsStore.setDarkMode 触发全局主题切换 -->
      <div
        class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
      >
        <div>
          <div class="text-sm font-medium text-surface-800 dark:text-surface-100">Dark mode</div>
          <div class="text-xs text-surface-500 dark:text-surface-300">Toggle application theme</div>
        </div>
        <!-- 使用 :model-value + @update 解耦，由 store 方法统一处理持久化 -->
        <ToggleSwitch :model-value="darkMode" @update:model-value="userSettingsStore.setDarkMode" />
      </div>

      <!-- 显示难度开关：直接 v-model 到 settings.questions.showDifficulty，自动持久化 -->
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

      <!-- 显示时间开关：直接 v-model 到 settings.questions.showTime，自动持久化 -->
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

      <!-- AI 模型选择器：从 availableModels 加载可用模型列表，加载中时显示 loading 状态 -->
      <div
        class="rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
      >
        <div class="mb-2 text-sm font-medium text-surface-800 dark:text-surface-100">
          Question model
        </div>
        <!-- option-value="value" 确保存储的是模型 code 字符串而非整个对象 -->
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
  </section>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 profile 领域的界面展示与交互行为（组件：ProfilePreferencesSection）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useUserSettingsStore } from '@/stores/userStore'
import { storeToRefs } from 'pinia'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import { onMounted } from 'vue'

const userSettingsStore = useUserSettingsStore()
// storeToRefs 确保解构后仍保持响应性
const { settings, darkMode, availableModels, isLoadingModels } = storeToRefs(userSettingsStore)

// 组件挂载时加载可用模型列表（内部有缓存判断，重复调用不会发起多余请求）
onMounted(() => {
  void userSettingsStore.loadAvailableModels()
})
</script>
