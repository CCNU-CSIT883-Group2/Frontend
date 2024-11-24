<template>
  <div class="user-dashboard">
    <h1>用户信息管理</h1>

    <!-- 总刷题量显示 -->
    <section>
      <h2>总刷题量</h2>
      <!-- 使用 PrimeVue 的 Badge 组件显示总刷题量 -->
      <p-badge :value="totalQuestions" severity="info" style="font-size: 1.2rem;"></p-badge>
    </section>

    <!-- 刷题天数显示 -->
    <section>
      <h2>刷题天数</h2>
      <!-- 使用 PrimeVue 的 Badge 组件显示刷题天数 -->
      <p-badge :value="totalDays" severity="success" style="font-size: 1.2rem;"></p-badge>
    </section>

    <!-- 具体数据分析 -->
    <section>
      <h2>具体数据分析</h2>
      <!-- 使用 Button 组件实现跳转按钮 -->
      <Button label="查看详细数据分析" icon="pi pi-chart-bar" @click="navigateTo('/data-analysis')" />
    </section>

    <!-- 教师功能 -->
    <section>
      <h2>教师功能</h2>
      <!-- 使用 Button 组件实现跳转按钮 -->
      <Button label="教师功能（开发中）" icon="pi pi-user" class="p-button-secondary" @click="navigateTo('/teacher-features')" />
    </section>

    <!-- 个人信息简要显示 -->
    <section>
      <h2>个人信息</h2>
      <!-- 使用 Card 组件显示用户信息 -->
      <p-card>
        <template #title>用户信息</template>
        <template #content>
          <p>手机号: {{ user.phone }}</p>
          <p>邮箱: {{ user.email }}</p>
          <p>段位: {{ rank }}</p>
        </template>
      </p-card>
    </section>

    <!-- 修改个人信息 -->
    <section>
      <h2>修改个人信息</h2>
      <!-- 使用 Button 组件实现跳转按钮 -->
      <Button label="修改信息" icon="pi pi-pencil" class="p-button-warning" @click="navigateTo('/edit-profile')" />
    </section>

    <!-- 问题反馈 -->
    <section>
      <h2>问题反馈</h2>
      <Button label="问题反馈" icon="pi pi-envelope" class="p-button-help" @click="navigateTo('/feedback')" />
    </section>

    <!-- 我的收藏 -->
    <section>
      <h2>我的收藏</h2>
      <Button label="查看收藏" icon="pi pi-bookmark" @click="navigateTo('/favorites')" />
    </section>

    <!-- 错题本 -->
    <section>
      <h2>错题本</h2>
      <Button label="查看错题本" icon="pi pi-times-circle" class="p-button-danger" @click="navigateTo('/wrong-questions')" />
    </section>

    <!-- 刷题记录 -->
    <section>
      <h2>刷题记录</h2>
      <Button label="查看历史记录" icon="pi pi-history" class="p-button-info" @click="navigateTo('/history')" />
    </section>

    <!-- 排行榜 -->
    <section>
      <h2>排行榜</h2>
      <Button label="查看排行榜" icon="pi pi-star" class="p-button-success" @click="navigateTo('/leaderboard')" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

// 引入 PrimeVue 样式
// import "primevue/resources/themes/saga-blue/theme.css";   // PrimeVue 主题样式
// import "primevue/resources/primevue.min.css";             // PrimeVue 核心样式
// import "primeicons/primeicons.css";                       // PrimeIcons 图标样式

// 定义用户信息的类型
interface User {
  phone: string; // 用户手机号
  email: string; // 用户邮箱
}

// 响应式数据
const totalQuestions = ref<number>(520); // 总刷题量（示例数据）
const totalDays = ref<number>(120); // 总刷题天数（示例数据）

const user = ref<User>({
  phone: '123-456-7890', // 用户手机号
  email: 'user@example.com', // 用户邮箱
});

// 根据总刷题量动态计算段位
const rank = computed((): string => {
  if (totalQuestions.value > 1000) return '大师'; // 大师段位
  if (totalQuestions.value > 500) return '高手'; // 高手段位
  if (totalQuestions.value > 100) return '入门'; // 入门段位
  return '新手'; // 新手段位
});

// 路由跳转功能
const router = useRouter();
const navigateTo = (route: string): void => {
  router.push(route); // 跳转到指定路由
};
</script>

<style scoped>
.user-dashboard {
  font-family: Arial, sans-serif;
  margin: 20px;
}

section {
  margin-bottom: 20px;A
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>
