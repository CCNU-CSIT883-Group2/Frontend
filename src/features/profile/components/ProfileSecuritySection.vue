<template>
  <!-- 安全设置卡片：圆角边框白色背景 -->
  <section
    class="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
  >
    <!-- 标题区：左侧说明文字 + 右侧操作按钮（修改/取消/保存） -->
    <header class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Security</h2>
        <p class="text-sm text-surface-500 dark:text-surface-300">
          Change your password with real-time strength and rule checks.
        </p>
      </div>

      <!-- 非编辑状态：显示"Modify Password"入口按钮 -->
      <Button
        v-if="!isEditingPassword"
        label="Modify Password"
        icon="pi pi-key"
        size="small"
        text
        :disabled="isSaving"
        @click="emit('startPasswordEdit')"
      />
      <!-- 编辑状态：显示取消与保存两个按钮 -->
      <div v-else class="flex items-center gap-2">
        <Button
          label="Cancel"
          icon="pi pi-times"
          size="small"
          text
          severity="secondary"
          :disabled="isSaving"
          @click="emit('cancelPasswordEdit')"
        />
        <Button
          label="Save"
          icon="pi pi-check"
          size="small"
          :loading="isSaving"
          :disabled="isSaving"
          @click="emit('savePassword')"
        />
      </div>
    </header>

    <!-- 密码编辑区（仅编辑状态下渲染） -->
    <div v-if="isEditingPassword">
      <!-- 双列布局：新密码 + 确认密码 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <!-- 新密码输入框 -->
        <div class="space-y-2">
          <label
            for="profile-new-password"
            class="text-sm font-medium text-surface-700 dark:text-surface-200"
          >
            New password
          </label>
          <div class="relative">
            <InputText
              id="profile-new-password"
              v-model="newPasswordModel"
              class="w-full pr-10"
              :type="showNewPassword ? 'text' : 'password'"
              placeholder="Create a new password"
              autocomplete="new-password"
            />
            <!-- 切换明文/密文显示的眼睛图标按钮 -->
            <Button
              :icon="showNewPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              text
              severity="secondary"
              class="!absolute right-0 top-1/2 -translate-y-1/2"
              aria-label="Toggle new password visibility"
              @click="showNewPassword = !showNewPassword"
            />
          </div>
        </div>

        <!-- 确认密码输入框（结构与新密码相同） -->
        <div class="space-y-2">
          <label
            for="profile-confirm-password"
            class="text-sm font-medium text-surface-700 dark:text-surface-200"
          >
            Confirm password
          </label>
          <div class="relative">
            <InputText
              id="profile-confirm-password"
              v-model="confirmPasswordModel"
              class="w-full pr-10"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm the new password"
              autocomplete="new-password"
            />
            <Button
              :icon="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              text
              severity="secondary"
              class="!absolute right-0 top-1/2 -translate-y-1/2"
              aria-label="Toggle confirm password visibility"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </div>
        </div>
      </div>

      <!-- 密码强度检测面板 -->
      <section
        class="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/40"
      >
        <!-- 强度标签行：左侧"Password strength"，右侧动态等级（Weak/Fair/Good/Strong） -->
        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="text-surface-700 dark:text-surface-200">Password strength</span>
          <span class="font-medium text-surface-900 dark:text-surface-0">{{
            passwordStrength.label
          }}</span>
        </div>

        <!-- 进度条：宽度由 passwordStrength.value (0-100) 控制，颜色由 barClass 控制 -->
        <div class="h-2 rounded-full bg-surface-200 dark:bg-surface-700">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="passwordStrength.barClass"
            :style="{ width: `${passwordStrength.value}%` }"
          />
        </div>

        <!-- 强度描述文字（如"Too easy to guess"） -->
        <p class="mt-2 text-xs text-surface-500 dark:text-surface-300">
          {{ passwordStrength.description }}
        </p>

        <!-- 规则校验清单：满足的规则显示绿色勾，未满足显示灰色圆圈 -->
        <ul class="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <li
            v-for="rule in passwordRules"
            :key="rule.key"
            class="flex items-center gap-2"
            :class="
              rule.passed
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-surface-500 dark:text-surface-300'
            "
          >
            <i class="pi text-xs" :class="rule.passed ? 'pi-check-circle' : 'pi-circle'" />
            <span>{{ rule.label }}</span>
          </li>
        </ul>
      </section>

      <!-- 底部状态提示：错误 > 可保存成功提示 > 待填写提示（三者互斥） -->
      <p v-if="passwordError" class="mt-3 text-sm text-red-500">{{ passwordError }}</p>
      <p v-else-if="hasPasswordChanges" class="mt-3 text-sm text-emerald-500">
        Password update is ready to save.
      </p>
      <p v-else-if="hasPasswordInput" class="mt-3 text-sm text-surface-500 dark:text-surface-300">
        Complete both fields to enable password update.
      </p>
    </div>
    <!-- 非编辑状态：显示提示文案，引导用户点击"Modify Password" -->
    <p v-else class="text-sm text-surface-500 dark:text-surface-300">
      Password fields are shown only when you click
      <span class="font-medium">Modify Password</span>.
    </p>
  </section>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 profile 领域的界面展示与交互行为（组件：ProfileSecuritySection）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import type {
  PasswordRuleState,
  PasswordStrengthState,
} from '@/features/profile/composables/useProfileWorkspace'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { ref, watch } from 'vue'

interface ProfileSecuritySectionProps {
  /** 密码规则清单（4 条规则，每条含 passed 状态） */
  passwordRules: PasswordRuleState[]
  /** 密码强度状态（标签、进度值、颜色类、描述） */
  passwordStrength: PasswordStrengthState
  /** 综合密码错误信息（空字符串表示无误或未输入） */
  passwordError: string
  /** 两个密码字段中任意一个有输入 */
  hasPasswordInput: boolean
  /** 密码有效且无错误（可触发保存） */
  hasPasswordChanges: boolean
  /** 是否处于密码编辑模式 */
  isEditingPassword: boolean
  /** 是否正在保存中（控制按钮加载状态） */
  isSaving: boolean
}

const props = defineProps<ProfileSecuritySectionProps>()

/** 向父组件冒泡密码编辑生命周期事件 */
const emit = defineEmits<{
  startPasswordEdit: []
  cancelPasswordEdit: []
  savePassword: []
}>()

// 密码字段通过 defineModel 双向绑定到父组件的 form 对象
const newPasswordModel = defineModel<string>('newPassword', { default: '' })
const confirmPasswordModel = defineModel<string>('confirmPassword', { default: '' })

/** 新密码明/密文切换状态（本地 UI 状态，不需要传给父组件） */
const showNewPassword = ref(false)
/** 确认密码明/密文切换状态 */
const showConfirmPassword = ref(false)

/**
 * 监听编辑模式退出事件：
 * 取消或保存成功后，自动将密码框恢复为密文模式，避免下次打开时意外显示明文。
 */
watch(
  () => props.isEditingPassword,
  (isEditing) => {
    if (!isEditing) {
      showNewPassword.value = false
      showConfirmPassword.value = false
    }
  },
)
</script>
