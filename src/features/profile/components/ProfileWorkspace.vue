<template>
  <!-- 最外层容器：水平居中，上下左右留边，撑满剩余高度 -->
  <div class="m-3 flex w-full flex-1 justify-center">
    <!-- PrimeVue Toast 通知组件，挂载在右上角，用于显示成功/失败消息 -->
    <Toast position="top-right" />

    <div class="flex w-full max-w-7xl flex-col gap-4 pb-3">
      <!-- 三列响应式网格：小屏单列，大屏左侧摘要卡片 + 右侧两列内容 -->
      <section class="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <!-- 左侧：用户摘要卡片（头像、姓名、活跃度图表、登出按钮） -->
        <ProfileSummaryCard :name="displayName" :email="displayEmail" :role="displayRole" :user-id="userId"
          :initials="initials" :last-saved-label="lastSavedLabel" :is-activity-loading="isActivityLoading"
          :activity-chart-data="activityChartData" :activity-chart-options="activityChartOptions"
          :unsaved-changes-count="unsavedChangesCount" :is-logging-out="isLoggingOut" @copy-user-id="copyUserId"
          @logout="logout" />

        <!-- 右侧：占据两列，竖向堆叠偏好设置、账户信息、安全设置 -->
        <div class="flex flex-col gap-4 lg:col-span-2">
          <!-- 偏好设置区：深色模式、题目展示选项、AI 模型选择 -->
          <ProfilePreferencesSection />

          <!-- 基本信息区：编辑姓名、邮箱；通过 v-model 双向绑定到 form -->
          <ProfileAccountSection v-model:name="form.name" v-model:email="form.email" :name-error="nameError"
            :email-error="emailError" :is-saving-name="isSavingName" :is-saving-email="isSavingEmail"
            @save-name="saveName" @save-email="saveEmail" />

          <!-- 安全设置区：密码修改（含强度检测与规则校验清单） -->
          <ProfileSecuritySection v-model:new-password="form.newPassword"
            v-model:confirm-password="form.confirmPassword" :password-rules="passwordRules"
            :password-strength="passwordStrength" :password-error="passwordError" :has-password-input="hasPasswordInput"
            :has-password-changes="hasPasswordChanges" :is-editing-password="isPasswordEditing"
            :is-saving="isSavingPassword" @start-password-edit="startPasswordEditing"
            @cancel-password-edit="cancelPasswordEditing" @save-password="savePassword" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 profile 领域的界面展示与交互行为（组件：ProfileWorkspace）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useProfileWorkspace } from '@/features/profile/composables/useProfileWorkspace'
import ProfileAccountSection from '@/features/profile/components/ProfileAccountSection.vue'
import ProfilePreferencesSection from '@/features/profile/components/ProfilePreferencesSection.vue'
import ProfileSecuritySection from '@/features/profile/components/ProfileSecuritySection.vue'
import ProfileSummaryCard from '@/features/profile/components/ProfileSummaryCard.vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { watch } from 'vue'

// 从 composable 解构所有响应式状态和操作函数
const {
  form,
  isSavingName,
  isSavingEmail,
  isSavingPassword,
  isLoggingOut,
  isPasswordEditing,
  isActivityLoading,
  errorMessage,
  successMessage,
  displayName,
  displayEmail,
  displayRole,
  userId,
  initials,
  nameError,
  emailError,
  hasPasswordInput,
  hasPasswordChanges,
  passwordRules,
  passwordStrength,
  passwordError,
  unsavedChangesCount,
  lastSavedLabel,
  activityChartData,
  activityChartOptions,
  saveName,
  saveEmail,
  startPasswordEditing,
  cancelPasswordEditing,
  savePassword,
  copyUserId,
  logout,
} = useProfileWorkspace()

// PrimeVue Toast 服务，用于弹出操作反馈通知
const toast = useToast()

/**
 * 监听 composable 中的 errorMessage：
 * - 有内容时弹出红色错误通知（显示 3.2 秒）；
 * - 消费后立即清空，避免重复触发。
 */
watch(errorMessage, (message) => {
  if (!message) return

  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: message,
    life: 3200,
  })
  errorMessage.value = ''
})

/**
 * 监听 composable 中的 successMessage：
 * - 有内容时弹出绿色成功通知（显示 2.6 秒，比错误通知更短）；
 * - 消费后立即清空。
 */
watch(successMessage, (message) => {
  if (!message) return

  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: message,
    life: 2600,
  })
  successMessage.value = ''
})
</script>
