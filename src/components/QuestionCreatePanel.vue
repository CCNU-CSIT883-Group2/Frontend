<template>
  <div class="flex-1 flex justify-center">
    <Fieldset class="mt-24 w-2/5 max-h-96 mr-44" legend="Want to do some quizzes?">
      <div class="flex flex-col justify-between w-full h-64 mt-8 px-4">
        <float-label variant="on" class="w-full">
          <input-text id="subject" class="w-full" />
          <label for="subject">Subject</label>
        </float-label>
        <float-label variant="on" class="w-full">
          <input-text id="tag" class="w-full" />
          <label for="tag">Tag</label>
        </float-label>
        <div class="flex justify-between flex-wrap">
          <float-label variant="on" class="w-2/5">
            <input-number id="number" class="w-full" />
            <label for="number">Number of Questions</label>
          </float-label>
          <select-button size="small" :options="questionTypes" :default-value="questionTypes[0]" />
        </div>
        <Button class="w-full" severity="secondary">Start Quiz</Button>
      </div>
    </Fieldset>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const questionTypes = ref(['Single Choice', 'Multiple Choice'])
</script>

<style scoped></style>
