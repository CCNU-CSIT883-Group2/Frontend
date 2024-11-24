<template>
  <div class="bg-surface-50 dark:bg-surface-950 px-5 py-20 mx-auto w-full ">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border w-full max-w-15xl mx-auto">
      <div class="text-center mb-8">
        <svg class="mb-4 mx-auto fill-surface-600 dark:fill-surface-200 h-16" viewBox="0 0 30 32" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <!-- SVG 内容保持不变 -->
        </svg>

        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Register Now</div>
        <span class="text-surface-600 dark:text-surface-200 font-medium leading-normal">Already have an
          account?</span>
        <a class="font-medium no-underline ml-2 text-primary cursor-pointer" @click="goToLogin">Login here!</a>
      </div>

      <div class=" grid-cols-1 gap-8">
        <div>
          <label for="user-role" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">User Role</label>
          <Select v-model="selectedRole" :options="roles" optionLabel="name" placeholder="Select a Role" checkmark
            :highlightOnSelect="false" class="w-full mb-4" />

          <label for="username" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">Username</label>
          <FloatLabel variant="in">
            <InputText id="username" v-model="username" variant="filled" />
            <label for="username">Username</label>
          </FloatLabel>
        </div>

        <div>
          <label for="email" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">Email</label>
          <FloatLabel variant="in">
            <InputText id="email" v-model="email" variant="filled" />
            <label for="email">Email</label>
          </FloatLabel>

          <label for="password" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">Password</label>
          <FloatLabel variant="in">
            <InputText id="password" v-model="password" type="password" variant="filled" />
            <label for="password">Password</label>
          </FloatLabel>
        </div>

        <div>
          <label for="confirm-password" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">Confirm
            Password</label>
          <FloatLabel variant="in">
            <InputText id="confirm-password" v-model="confirmPassword" type="password" variant="filled" />
            <label for="confirm-password">Confirm Password</label>
          </FloatLabel>
        </div>

        <div>
          <div class="flex items-center">
            <Checkbox id="terms" v-model="termsAccepted" class="mr-2" :binary="true" />
            <label for="terms" class="text-surface-900 dark:text-surface-0">I accept the terms and conditions</label>
          </div>
          <a class="font-medium no-underline mt-4 block text-primary cursor-pointer" @click="showTerms">Read Terms</a>
        </div>
      </div>

      <div class="mt-8">
        <Button label="Register" icon="pi pi-user-plus" class="w-full" :disabled="!termsAccepted || passwordMismatch"
          @click="goToLogin" />
      </div>
    </div>

    <Dialog v-model:visible="termsDialogVisible" :style="{ width: '50vw' }" header="Terms and Conditions"
      :modal="true">
      <div v-html="termsContent"></div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" @click="termsDialogVisible = false" />
        <Button label="Agree" icon="pi pi-check" @click="agreeTerms" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// 定义角色类型
interface Role {
  name: string;
  value: string;
}

// 定义响应式数据
const roles = ref<Role[]>([
  { name: 'Admin', value: 'admin' },
  { name: 'User', value: 'user' },
  { name: 'Guest', value: 'guest' },
]);

const selectedRole = ref<string>(''); // 用户选择的角色
const username = ref<string>(''); // 用户名
const email = ref<string>(''); // 邮箱
const password = ref<string>(''); // 密码
const confirmPassword = ref<string>(''); // 确认密码
const termsAccepted = ref<boolean>(false); // 是否接受条款
const termsDialogVisible = ref<boolean>(false); // 条款弹窗可见性

// 定义条款内容
const termsContent = ref<string>('<p>Your terms and conditions here.</p>');

// 计算属性：密码是否匹配
const passwordMismatch = computed(() => password.value !== confirmPassword.value);

// 方法：跳转到登录页面
const goToLogin = (): void => {
  console.log('Navigate to login page');
};

// 方法：显示条款
const showTerms = (): void => {
  termsDialogVisible.value = true;
};

// 方法：同意条款
const agreeTerms = (): void => {
  termsAccepted.value = true;
  termsDialogVisible.value = false;
};
</script>

<style scoped>
.bg-surface-50 {
  /* 自定义浅色背景样式 */
}

.dark\:bg-surface-950 {
  /* 自定义深色背景样式 */
}

/* 其他样式保持不变 */
</style>
