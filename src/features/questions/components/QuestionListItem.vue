<template>
  <!-- 使用 PrimeVue Fieldset 实现可折叠的题目卡片 -->
  <Fieldset v-model:collapsed="isCollapsed" toggleable>
    <!-- 自定义图例区域：折叠图标 + 题号 + 可选难度星级 -->
    <template #legend>
      <button
        type="button"
        class="w-full flex items-center px-2 py-1 cursor-pointer"
        @click.stop="toggleCardCollapsed"
      >
        <!-- 折叠状态图标：折叠时向右箭头，展开时向下箭头 -->
        <i :class="isCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down'" class="text-xs mr-2" />
        <span class="font-bold">Question {{ no }}</span>
        <span
          v-if="saveState === 'saved' && selectedAttemptIndices.length > 0"
          class="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-green-600"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-green-600" />
          Saved
        </span>
        <!-- 难度星级（受用户"显示难度"设置控制） -->
        <div v-if="settings.questions.showDifficulty" class="font-bold ml-2 flex items-center">
          <span class="mr-2">-</span>
          <Rating :default-value="question.difficulty" readonly />
        </div>
      </button>
    </template>

    <!-- 卡片展开后的内容区域 -->
    <div class="flex flex-col gap-2">
      <!-- 题目内容折叠区（可独立折叠，与卡片折叠分离） -->
      <button
        type="button"
        class="mx-2.5 mt-1 flex items-center justify-between text-left font-semibold text-surface-700 dark:text-surface-200"
        @click="isQuestionSectionCollapsed = !isQuestionSectionCollapsed"
      >
        <span>Question</span>
        <i
          :class="isQuestionSectionCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down'"
          class="text-xs"
        />
      </button>

      <div v-show="!isQuestionSectionCollapsed">
        <!-- 题目正文 -->
        <p class="mx-2.5 mb-2.5">{{ question.content }}</p>

        <!-- 选项列表：使用 PrimeVue SelectButton 实现单选/多选切换 -->
        <div class="flex">
          <SelectButton
            v-model="selectedOption"
            :disabled="isAnswered"
            :multiple="question.type === 'multi'"
            :options="optionItems"
            class="flex-1 flex flex-col"
            option-label="label"
            option-value="index"
          >
            <template #option="slot">
              <!-- 已作答时高亮正确选项（绿色）和错误选项（红色） -->
              <div
                class="px"
                :class="{
                  'text-green-600 font-extrabold': isCorrectOption(slot.option.index),
                  'text-red-600 font-extrabold': isWrongOption(slot.option.index),
                }"
              >
                <span>{{ slot.option.label }}</span>
              </div>
            </template>
          </SelectButton>
        </div>
      </div>

      <!-- 解析区域（仅在已作答状态下显示，可独立折叠） -->
      <div v-if="isAnswered" class="flex flex-col gap-2">
        <button
          type="button"
          class="mx-2.5 mt-1 flex items-center justify-between text-left font-semibold text-surface-700 dark:text-surface-200"
          @click="isExplanationCollapsed = !isExplanationCollapsed"
        >
          <span>Explanation</span>
          <i :class="isExplanationCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down'" class="text-xs" />
        </button>

        <div v-show="!isExplanationCollapsed" class="mx-2.5">
          {{ question.explanation }}
        </div>
      </div>
    </div>
  </Fieldset>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 questions 领域的界面展示与交互行为（组件：QuestionListItem）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useUserSettingsStore } from '@/stores/userStore'
import type { Question, QuestionSaveState } from '@/types'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

/** 选项按钮的数据结构（label=选项文本，index=选项索引） */
interface OptionItem {
  label: string
  index: number
}

const props = withDefaults(
  defineProps<{
    /** 完整的题目数据 */
    question: Question
    /** 题目序号（从 1 开始） */
    no: number
    /** 是否已提交并保存作答 */
    isAnswered?: boolean
    /** 单题自动保存状态（仅 saved 时显示绿色标识） */
    saveState?: QuestionSaveState
  }>(),
  {
    isAnswered: false,
    saveState: 'idle',
  },
)

/** 卡片折叠状态（与父组件 collapsedStates[index] 双向绑定） */
const isCollapsed = defineModel<boolean>('isCollapsed', { default: false })
/** 当前题目的已选择选项索引数组（与父组件 attempts[index] 双向绑定） */
const selectedAttemptIndices = defineModel<number[]>('attempt', { default: [] })
/**
 * 重置令牌（父组件递增时触发本组件内部状态重置）。
 * 用于在不销毁组件的情况下重置用户选择和折叠面板状态。
 */
const resetToken = defineModel<number>('resetToken', { default: 0 })

/** 题目内容折叠状态（独立于卡片折叠，允许用户单独隐藏题目文本） */
const isQuestionSectionCollapsed = ref(false)
/** 解析区域折叠状态（作答后展示，可独立折叠） */
const isExplanationCollapsed = ref(false)

/**
 * 将 question.options 数组映射为带索引的选项对象。
 * SelectButton 通过 option-value="index" 存储索引，而非文本内容。
 */
const optionItems = computed<OptionItem[]>(() =>
  props.question.options.map((label, index) => ({
    label,
    index,
  })),
)

/**
 * 计算属性 selectedOption，适配单选/多选两种模式：
 *
 * getter：
 * - 无作答时返回 null（SelectButton 不选中任何项）；
 * - 单选题返回第一个索引（number）；
 * - 多选题返回索引数组（number[]）。
 *
 * setter：
 * - 处理 SelectButton 返回的 null/number/number[] 三种情况；
 * - 统一写入 selectedAttemptIndices（始终保持为 number[] 格式）。
 */
const selectedOption = computed<number | number[] | null>({
  get: () => {
    if (selectedAttemptIndices.value.length === 0) return null

    if (props.question.type === 'single') {
      return selectedAttemptIndices.value[0] ?? null
    }

    return selectedAttemptIndices.value
  },
  set: (value) => {
    if (value === null || value === undefined) {
      selectedAttemptIndices.value = []
      return
    }

    if (props.question.type === 'single') {
      // 单选题：取第一个值包装成数组
      selectedAttemptIndices.value = typeof value === 'number' ? [value] : []
      return
    }

    if (Array.isArray(value)) {
      // 多选题：过滤确保都是 number 类型
      selectedAttemptIndices.value = value.filter(
        (item): item is number => typeof item === 'number',
      )
      return
    }

    selectedAttemptIndices.value = typeof value === 'number' ? [value] : []
  },
})

/**
 * 监听 resetToken 变化：父组件重置时清除所选项并折叠所有面板。
 * 不销毁组件，动画更连续、性能更好。
 */
watch(resetToken, () => {
  selectedOption.value = null
  isQuestionSectionCollapsed.value = false
  isExplanationCollapsed.value = false
})

/**
 * 监听 isAnswered 变化：
 * 取消作答时（answered=false），自动展开解析区域，
 * 避免用户看不到已隐藏的解析内容。
 */
watch(
  () => props.isAnswered,
  (answered) => {
    if (!answered) {
      isExplanationCollapsed.value = false
    }
  },
)

/** 切换卡片折叠/展开（图例按钮点击时调用） */
const toggleCardCollapsed = () => {
  isCollapsed.value = !isCollapsed.value
}

/**
 * 判断某个选项是否为"正确且已选中"（绿色高亮）。
 * 条件：已作答 + 此选项在正确答案中 + 用户选择了此选项。
 */
const isCorrectOption = (index: number) => {
  return (
    selectedAttemptIndices.value.length !== 0 &&
    props.isAnswered &&
    props.question.correct_answers.includes(index) &&
    selectedAttemptIndices.value.includes(index)
  )
}

/**
 * 判断某个选项是否为"错误且已选中"（红色高亮）。
 * 条件：已作答 + 此选项不在正确答案中 + 用户选择了此选项。
 */
const isWrongOption = (index: number) => {
  return (
    selectedAttemptIndices.value.length !== 0 &&
    props.isAnswered &&
    !props.question.correct_answers.includes(index) &&
    selectedAttemptIndices.value.includes(index)
  )
}

const { settings } = storeToRefs(useUserSettingsStore())
</script>
