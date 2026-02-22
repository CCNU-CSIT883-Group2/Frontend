<template>
  <div class="h-screen flex flex-col m-0 bg-surface-0 dark:bg-surface-950">
    <AppHeaderBar />
    <div
      class="flex-1 overflow-y-scroll w-full h-full text-surface-950 dark:text-surface-0 no-scrollbar flex"
    >
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeaderBar from '@/features/layout/components/AppHeaderBar.vue'
</script>
