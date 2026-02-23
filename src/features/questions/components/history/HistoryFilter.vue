<template>
  <!-- 历史记录过滤工具栏：两行布局，第一行学科+新建按钮，第二行标签+进度状态 -->
  <div class="flex flex-col gap-2">
    <!-- 第一行：学科选择 + 新建（+）按钮 -->
    <div class="flex flex-wrap justify-between gap-2 sm:flex-nowrap">
      <FloatLabel class="flex-1" variant="on">
        <!-- 学科下拉选择器：支持搜索过滤，可清空，选中后显示勾号 -->
        <Select
          v-model="selectedSubject"
          :options="subjects"
          class="w-full border-color rounded-lg shadow-none"
          labelClass="text-sm"
          size="small"
          filter
          :highlight-on-select="false"
          reset-filter-on-hide
          show-clear
          checkmark
        >
          <template #option="slot">
            <span class="text-xsm font-bold">{{ slot.option }}</span>
          </template>
        </Select>
        <label class="text-xsm">Subject</label>
      </FloatLabel>

      <!-- 新建按钮：点击触发 isCreateRequested = true，由 composable 监听后切换面板 -->
      <Button
        icon="pi pi-plus"
        class="shrink-0"
        severity="secondary"
        size="small"
        @click="isCreateRequested = true"
      />
    </div>

    <!-- 第二行：标签选择 + 进度状态切换（三态：全部/进行中/已完成） -->
    <div class="flex flex-wrap justify-between gap-2 sm:flex-nowrap">
      <FloatLabel class="flex-1" variant="on">
        <!-- 标签下拉选择器（结构与学科选择器相同） -->
        <Select
          v-model="selectedTag"
          :options="tags"
          class="w-full border-color rounded-lg shadow-none"
          labelClass="text-sm"
          size="small"
          filter
          :highlight-on-select="false"
          reset-filter-on-hide
          show-clear
          checkmark
        >
          <template #option="slot">
            <span class="text-xsm font-bold">{{ slot.option }}</span>
          </template>
        </Select>
        <label class="text-xsm">Tag</label>
      </FloatLabel>

      <!-- 进度状态切换按钮组：圆圈图标=进行中，打勾圆圈=已完成 -->
      <SelectButton
        v-model="selectedProgress"
        :options="progressStatusOptions"
        class="shrink-0"
        data-key="value"
        option-label="value"
        size="small"
      >
        <template #option="slot">
          <i :class="slot.option.icon"></i>
        </template>
      </SelectButton>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 questions 领域的界面展示与交互行为（组件：HistoryFilter）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { type HistoryFilter, ProgressStatus } from '@/types'
import { computed } from 'vue'

withDefaults(
  defineProps<{
    /** 可选学科列表（来自历史记录去重） */
    subjects?: string[]
    /** 可选标签列表（来自历史记录去重） */
    tags?: string[]
  }>(),
  {
    subjects: () => [],
    tags: () => [],
  },
)

/** 新建请求标志（双向绑定，点击"+"按钮时由本组件设为 true，由父 composable 消费） */
const isCreateRequested = defineModel<boolean>('create', { default: false })
/**
 * 历史过滤条件（双向绑定到父组件，包含 subject/tag/content/status 四个维度）。
 * 使用整体对象而非拆分 prop 是为了保持过滤条件的原子性，避免多次 emit。
 */
const historyFilter = defineModel<HistoryFilter>('filter', {
  default: {
    subject: undefined,
    tag: undefined,
    content: [],
    status: ProgressStatus.All,
  },
})

/**
 * 学科选择的计算 getter/setter：
 * - Select 组件可返回 null（清空时），需转换为 undefined 写入 filter；
 * - 使用展开运算符保证对象引用更新，触发响应式更新。
 */
const selectedSubject = computed<string | null>({
  get: () => historyFilter.value.subject ?? null,
  set: (value) => {
    historyFilter.value = {
      ...historyFilter.value,
      subject: value ?? undefined,
    }
  },
})

/** 标签选择（逻辑与学科相同） */
const selectedTag = computed<string | null>({
  get: () => historyFilter.value.tag ?? null,
  set: (value) => {
    historyFilter.value = {
      ...historyFilter.value,
      tag: value ?? undefined,
    }
  },
})

/**
 * 进度状态选项（仅展示"进行中"和"已完成"两个按钮）。
 * 当两个按钮均未选中时（selectedProgress = null），
 * setter 将 status 设为 ProgressStatus.All（显示全部）。
 */
const progressStatusOptions = [
  { icon: 'pi pi-circle', value: ProgressStatus.InProgress },
  { icon: 'pi pi-check-circle', value: ProgressStatus.Finished },
]

/** 进度状态的计算 getter/setter，处理 null（全部）与具体状态之间的转换 */
const selectedProgress = computed<{ icon: string; value: ProgressStatus } | null>({
  get: () =>
    progressStatusOptions.find((option) => option.value === historyFilter.value.status) ?? null,
  set: (value) => {
    historyFilter.value = {
      ...historyFilter.value,
      // 无选中（点击已选中项取消）时回退到 All
      status: value?.value ?? ProgressStatus.All,
    }
  },
})
</script>
