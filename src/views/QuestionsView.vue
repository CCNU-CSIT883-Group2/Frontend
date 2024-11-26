<!-- <template>
  <div class="m-3 w-full flex-1 flex">
    <toast />
    <question-sidebar class="flex-none w-72" v-model:selected="selectedHistory" />
    <answer-panel
      :key="selectedHistory"
      :history-id="selectedHistory"
      class="flex-1 ml-2"
      v-if="selectedHistory !== -1"
    />
    <question-create-panel v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AnswerPanel from '@/components/AnswerPanel.vue'
import QuestionSidebar from '@/components/QuestionSidebar.vue'
import QuestionCreatePanel from '@/components/QuestionCreatePanel.vue'

const selectedHistory = ref(-1)
</script>

<style scoped></style>
