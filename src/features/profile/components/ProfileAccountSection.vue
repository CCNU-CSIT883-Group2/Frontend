<template>
  <!-- 基本信息编辑卡片：圆角边框白色背景 -->
  <section
    class="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
  >
    <header class="mb-4">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Basic information</h2>
      <p class="text-sm text-surface-500 dark:text-surface-300">
        Update the public profile fields used across your workspace.
      </p>
    </header>

    <!-- 双列响应式布局：姓名字段 + 邮箱字段 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <!-- 姓名字段 -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <!-- FloatLabel：浮动标签输入框，非编辑状态下 disabled 且背景透明 -->
          <FloatLabel variant="on" class="profile-account-floatlabel w-full">
            <InputText
              id="profile-name-edit"
              ref="nameInput"
              v-model="nameModel"
              class="w-full !bg-transparent disabled:!bg-transparent"
              autocomplete="name"
              :disabled="!isEditingName || isSavingName"
              @blur="commitField('name')"
              @keydown.enter.prevent="commitField('name')"
              @keydown.esc.prevent="cancelEdit('name')"
            />
            <label
              for="profile-name-edit"
              class="px-1"
              style="background-color: var(--p-content-background)"
            >
              Display name
            </label>
          </FloatLabel>
          <!-- 编辑中：显示取消按钮；非编辑中：显示编辑按钮 -->
          <Button
            v-if="isEditingName"
            label="Cancel"
            icon="pi pi-times"
            text
            size="small"
            severity="secondary"
            class="shrink-0"
            :disabled="isSavingName"
            @mousedown="prepareCancel('name')"
            @click="cancelEdit('name')"
          />
          <Button
            v-else
            label="Edit"
            icon="pi pi-pencil"
            text
            size="small"
            class="shrink-0"
            :disabled="isSavingName"
            @click="startEdit('name')"
          />
        </div>
        <!-- 实时校验错误（由父组件通过 nameError prop 传入） -->
        <p v-if="nameError" class="text-sm text-red-500">{{ nameError }}</p>
      </div>

      <!-- 邮箱字段（与姓名字段结构相同） -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <FloatLabel variant="on" class="profile-account-floatlabel w-full">
            <InputText
              id="profile-email-edit"
              ref="emailInput"
              v-model="emailModel"
              class="w-full !bg-transparent disabled:!bg-transparent"
              autocomplete="email"
              type="email"
              :disabled="!isEditingEmail || isSavingEmail"
              @blur="commitField('email')"
              @keydown.enter.prevent="commitField('email')"
              @keydown.esc.prevent="cancelEdit('email')"
            />
            <label
              for="profile-email-edit"
              class="px-1"
              style="background-color: var(--p-content-background)"
            >
              Email address
            </label>
          </FloatLabel>
          <Button
            v-if="isEditingEmail"
            label="Cancel"
            icon="pi pi-times"
            text
            size="small"
            severity="secondary"
            class="shrink-0"
            :disabled="isSavingEmail"
            @mousedown="prepareCancel('email')"
            @click="cancelEdit('email')"
          />
          <Button
            v-else
            label="Edit"
            icon="pi pi-pencil"
            text
            size="small"
            class="shrink-0"
            :disabled="isSavingEmail"
            @click="startEdit('email')"
          />
        </div>
        <p v-if="emailError" class="text-sm text-red-500">{{ emailError }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 profile 领域的界面展示与交互行为（组件：ProfileAccountSection）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import { nextTick, reactive, ref, useTemplateRef } from 'vue'

/** 可编辑字段的联合类型，限定为姓名和邮箱 */
type EditableField = 'name' | 'email'

interface ProfileAccountSectionProps {
  /** 姓名字段的实时校验错误（空字符串表示无误） */
  nameError: string
  /** 邮箱字段的实时校验错误（空字符串表示无误） */
  emailError: string
  /** 姓名是否正在保存中 */
  isSavingName: boolean
  /** 邮箱是否正在保存中 */
  isSavingEmail: boolean
}

const props = defineProps<ProfileAccountSectionProps>()

/** 向父组件冒泡保存事件，由父组件调用对应的 composable 方法 */
const emit = defineEmits<{
  saveName: []
  saveEmail: []
}>()

// defineModel 实现双向绑定：父组件通过 v-model:name 和 v-model:email 传入并接收变更
const nameModel = defineModel<string>('name', { default: '' })
const emailModel = defineModel<string>('email', { default: '' })

/** 姓名/邮箱各自的编辑模式标志 */
const isEditingName = ref(false)
const isEditingEmail = ref(false)

/**
 * 进入编辑模式前保存字段快照，用于取消时恢复原始值。
 * reactive 对象便于统一按字段名访问。
 */
const fieldSnapshot = reactive<Record<EditableField, string>>({
  name: '',
  email: '',
})

/**
 * 标记"即将取消"的字段。
 * 用于解决 blur 与 Cancel 按钮 click 的事件顺序问题：
 * - 鼠标按下取消按钮时先触发 blur → commitField；
 * - prepareCancel 在 mousedown 时设置此标志，让 commitField 识别并跳过保存。
 */
const pendingCancelField = ref<EditableField | null>(null)

// 模板引用，用于进入编辑模式后自动聚焦输入框
const nameInput = useTemplateRef<HTMLInputElement>('nameInput')
const emailInput = useTemplateRef<HTMLInputElement>('emailInput')

/** 统一设置某字段的编辑状态 */
const setEditing = (field: EditableField, value: boolean) => {
  if (field === 'name') {
    isEditingName.value = value
    return
  }

  isEditingEmail.value = value
}

/** 读取当前字段的 model 值 */
const getFieldValue = (field: EditableField) => {
  if (field === 'name') return nameModel.value
  return emailModel.value
}

/** 写入当前字段的 model 值 */
const setFieldValue = (field: EditableField, value: string) => {
  if (field === 'name') {
    nameModel.value = value
    return
  }

  emailModel.value = value
}

/**
 * 进入编辑模式：
 * 1. 若正在保存则不允许进入；
 * 2. 记录快照（取消时用于回滚）；
 * 3. 等待 DOM 更新后聚焦对应输入框。
 */
const startEdit = (field: EditableField) => {
  if (field === 'name' && props.isSavingName) return
  if (field === 'email' && props.isSavingEmail) return

  fieldSnapshot[field] = getFieldValue(field)
  setEditing(field, true)

  nextTick(() => {
    if (field === 'name') {
      nameInput.value?.focus()
      return
    }

    emailInput.value?.focus()
  })
}

/**
 * 取消编辑：
 * 1. 清除"即将取消"标志；
 * 2. 将字段值回滚到快照；
 * 3. 退出编辑模式。
 */
const cancelEdit = (field: EditableField) => {
  pendingCancelField.value = null
  setFieldValue(field, fieldSnapshot[field])
  setEditing(field, false)
}

/**
 * mousedown 时设置"即将取消"标志。
 * 在 blur → commitField 执行之前先标记，让 commitField 跳过保存逻辑。
 */
const prepareCancel = (field: EditableField) => {
  pendingCancelField.value = field
}

/**
 * 提交字段（blur / Enter 时触发）：
 * 1. 若当前字段并非编辑状态，直接忽略（避免 disabled 状态下的 blur 触发）；
 * 2. 若"即将取消"标志已设置，清除标志后提前返回，让 cancelEdit 接管；
 * 3. 若正在保存或校验有误，拦截提交；
 * 4. 值未变化时仅退出编辑模式，不发起网络请求；
 * 5. 值有变化时先 trim 再触发对应 save 事件，交由父组件处理持久化。
 */
const commitField = (field: EditableField) => {
  if ((field === 'name' && !isEditingName.value) || (field === 'email' && !isEditingEmail.value)) {
    return
  }

  if (pendingCancelField.value === field) {
    pendingCancelField.value = null
    return
  }

  if (field === 'name') {
    if (props.isSavingName || props.nameError) return
    nameModel.value = nameModel.value.trim()
    if (nameModel.value === fieldSnapshot.name) {
      setEditing('name', false)
      return
    }
    emit('saveName')
    setEditing('name', false)
    return
  }

  if (props.isSavingEmail || props.emailError) return
  emailModel.value = emailModel.value.trim()
  if (emailModel.value === fieldSnapshot.email) {
    setEditing('email', false)
    return
  }
  emit('saveEmail')
  setEditing('email', false)
}
</script>
