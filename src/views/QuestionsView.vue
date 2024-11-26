<template>
  <div class="m-3 w-full flex-1 flex">
    <question-sidebar class="flex-none w-72" />
    <router-view class="flex-1 ml-2" />
  </div>
</template>

<script setup lang="ts">
import QuestionSidebar from '@/components/QuestionSidebar.vue'
</script>

<style scoped></style>
