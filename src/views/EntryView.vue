<template>
=
  <div>
    <div class="bg-surface-0 dark:bg-surface-950 w-screen h-screen flex items-center justify-center lg:px-20">
      <div class="text-surface-700 dark:text-surface-100 text-center">
        <div class="text-primary font-bold mb-4">
          <i class="pi pi-brain" />&nbsp;POWERED BY CHATGPT
        </div>
        <div
          class="text-surface-900 dark:text-surface-0 font-bold text-5xl mb-4"
        >
          Welcome to ChatCNU
        </div>
        <div class="text-surface-700 dark:text-surface-100 text-2xl mb-8">
          Revolutionize question generation with the power of ChatGPT.
        </div>
        <Button
          class="font-bold px-8 py-4 whitespace-nowrap"
          icon="pi pi-brain"
          label="Get Started"
          raised
          rounded
          @click="goToOverview"
        />
      </div>
    </div>

    <div
      class="bg-surface-0 dark:bg-surface-950 px-6 py-20 md:px-12 lg:px-20 text-center"
    >
      <div class="mb-4 font-bold text-3xl">
        <span class="text-surface-900 dark:text-surface-0">Discover, </span>
        <span class="text-primary-600 dark:text-primary-400"
          >Innovate, Excel</span
        >
      </div>
      <div class="text-surface-700 dark:text-surface-0/70 mb-[3rem]">
        Transform your learning and teaching experiences with AI-driven solutions.
      </div>
      <div
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-3.5 gap-y-6"
      >
        <div class="w-full p-4">
          <span
            class="w-16 h-16 mb-6 rounded-lg flex items-center justify-center mx-auto bg-surface-0 dark:bg-surface-800 shadow-[0px_2px_6px_0px_rgba(0,0,0,0.12),0px_0px_2px_0px_rgba(0,0,0,0.06),0px_4px_10px_0px_rgba(0,0,0,0.03)]"
          >
            <i
              class="pi pi-user text-2xl lg:text-3xl text-primary-500 dark:text-primary-400"
            />
          </span>
          <div
            class="text-surface-900 dark:text-surface-0 text-xl mb-2 font-medium"
          >
            Personalized Question Generation
          </div>
          <p
            class="text-surface-700 dark:text-surface-0/70 leading-normal max-w-sm mx-auto text-center"
          >
            Tailored questions based on users' learning level, interests, and goals.
          </p>
        </div>
        <div class="w-full p-4">
          <span
            class="w-16 h-16 mb-6 rounded-lg flex items-center justify-center mx-auto bg-surface-0 dark:bg-surface-800 shadow-[0px_2px_6px_0px_rgba(0,0,0,0.12),0px_0px_2px_0px_rgba(0,0,0,0.06),0px_4px_10px_0px_rgba(0,0,0,0.03)]"
          >
            <i
              class="pi pi-list text-2xl lg:text-3xl text-primary-500 dark:text-primary-400"
            />
          </span>
          <div
            class="text-surface-900 dark:text-surface-0 text-xl mb-2 font-medium"
          >
            Diverse Question Types
          </div>
          <p
            class="text-surface-700 dark:text-surface-0/70 leading-normal max-w-sm mx-auto text-center"
          >
            Supports multiple formats, including multiple-choice, fill-in-the-blank, and more.
          </p>
        </div>
        <div class="w-full p-4">
          <span
            class="w-16 h-16 mb-6 rounded-lg flex items-center justify-center mx-auto bg-surface-0 dark:bg-surface-800 shadow-[0px_2px_6px_0px_rgba(0,0,0,0.12),0px_0px_2px_0px_rgba(0,0,0,0.06),0px_4px_10px_0px_rgba(0,0,0,0.03)]"
          >
            <i
              class="pi pi-refresh text-2xl lg:text-3xl text-primary-500 dark:text-primary-400"
            />
          </span>
          <div
            class="text-surface-900 dark:text-surface-0 text-xl mb-2 font-medium"
          >
            Real-Time Updates
          </div>
          <p
            class="text-surface-700 dark:text-surface-0/70 leading-normal max-w-sm mx-auto text-center"
          >
            Stay ahead with questions dynamically generated from the latest trends.
          </p>
        </div>
        <div class="w-full p-4">
          <span
            class="w-16 h-16 mb-6 rounded-lg flex items-center justify-center mx-auto bg-surface-0 dark:bg-surface-800 shadow-[0px_2px_6px_0px_rgba(0,0,0,0.12),0px_0px_2px_0px_rgba(0,0,0,0.06),0px_4px_10px_0px_rgba(0,0,0,0.03)]"
          >
            <i
              class="pi pi-user-edit text-2xl lg:text-3xl text-primary-500 dark:text-primary-400"
            />
          </span>
          <div
            class="text-surface-900 dark:text-surface-0 text-xl mb-2 font-medium"
          >
            Labor Resource Savings
          </div>
          <p
            class="text-surface-700 dark:text-surface-0/70 leading-normal max-w-sm mx-auto text-center"
          >
            Significantly reduce time and costs in question creation with automation.
          </p>
        </div>
        <div class="w-full p-4">
          <span
            class="w-16 h-16 mb-6 rounded-lg flex items-center justify-center mx-auto bg-surface-0 dark:bg-surface-800 shadow-[0px_2px_6px_0px_rgba(0,0,0,0.12),0px_0px_2px_0px_rgba(0,0,0,0.06),0px_4px_10px_0px_rgba(0,0,0,0.03)]"
          >
            <i
              class="pi pi-comments text-2xl lg:text-3xl text-primary-500 dark:text-primary-400"
            />
          </span>
          <div
            class="text-surface-900 dark:text-surface-0 text-xl mb-2 font-medium"
          >
            High Interactivity
          </div>
          <p
            class="text-surface-700 dark:text-surface-0/70 leading-normal max-w-sm mx-auto text-center"
          >
            Users can get real-time hints, explanations, and detailed analyses.
          </p>
        </div>
        <div class="w-full p-4">
          <span
            class="w-16 h-16 mb-6 rounded-lg flex items-center justify-center mx-auto bg-surface-0 dark:bg-surface-800 shadow-[0px_2px_6px_0px_rgba(0,0,0,0.12),0px_0px_2px_0px_rgba(0,0,0,0.06),0px_4px_10px_0px_rgba(0,0,0,0.03)]"
          >
            <i
              class="pi pi-chart-line text-2xl lg:text-3xl text-primary-500 dark:text-primary-400"
            />
          </span>
          <div
            class="text-surface-900 dark:text-surface-0 text-xl mb-2 font-medium"
          >
            Practice Data Analysis
          </div>
          <p
            class="text-surface-700 dark:text-surface-0/70 leading-normal max-w-sm mx-auto text-center"
          >
            Analyze user performance to recommend targeted and effective questions.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const router = useRouter()

const goToOverview = () => {
  router.push({ name: 'login' })
}
</script>
