
<template>
  <div class="bg-surface-50 dark:bg-surface-950 w-screen h-screen flex items-center justify-center px-4 sm:px-8">
    <div class="bg-surface-0 dark:bg-surface-900 p-8 shadow-lg rounded-lg w-full max-w-2xl flex flex-col items-center">
      <!-- 顶部标题 -->
      <div class="text-center mb-6 w-full">
        <svg class="mb-4 mx-auto fill-surface-600 dark:fill-surface-200 h-16" viewBox="0 0 30 32" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <!-- SVG 内容保持不变 -->
        </svg>

        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">Register Now</div>
        <div class="flex justify-center">
          <span class="text-surface-600 dark:text-surface-200 font-medium">Already have an account?</span>
          <a class="font-medium ml-2 text-primary cursor-pointer" @click="goToLogin">Login here!</a>
        </div>
      </div>

      <!-- 表单内容 -->
      <div class="flex flex-col space-y-2 w-full max-w-lg">
        <!-- 用户角色 -->
        <div class="flex flex-col">
          <label for="user-role" class="text-surface-900 dark:text-surface-0 font-medium mb-2">User Role</label>
          <Select v-model="selectedRole" :options="roles" optionLabel="name" placeholder="Select a Role" checkmark
            :highlightOnSelect="false" class="w-full" />
        </div>

        <!-- 用户名 -->
        <div class="flex flex-col">
          <label for="username" class="text-surface-900 dark:text-surface-0 font-medium mb-2">Username</label>
          <FloatLabel variant="in">
            <InputText id="username" v-model="username" variant="filled" class="w-full h-12" />
            <label for="username">Username</label>
          </FloatLabel>
        </div>

        <!-- 邮箱 -->
        <div class="flex flex-col">
          <label for="email" class="text-surface-900 dark:text-surface-0 font-medium mb-2">Email</label>
          <FloatLabel variant="in">
            <InputText id="email" v-model="email" variant="filled" class="w-full h-12" />
            <label for="email">Email</label>
          </FloatLabel>
        </div>

        <!-- 密码 -->
        <div class="flex flex-col">
          <label for="password" class="text-surface-900 dark:text-surface-0 font-medium mb-2">Password</label>
          <FloatLabel variant="in">
            <InputText
              id="password"
              v-model="password"
              type="password"
              variant="filled"
              class="w-full h-12"
              @input="checkPasswordStrength"

            />
            <label for="password">Password</label>
          </FloatLabel>
          <div v-if="password.length > 0" class="mt-2">
            <div class="text-sm mb-2">Password Strength</div>
            <div class="h-2 rounded-full w-full bg-gray-200">
              <div
                :class="passwordStrengthStyle.backgroundColor"
                :style="{ width: passwordStrengthStyle.width }"
                class="h-full rounded-full"
              ></div>
            </div>
          </div>
        </div>

        <!-- 确认密码 -->
        <div class="flex flex-col">
          <label for="confirm-password" class="text-surface-900 dark:text-surface-0 font-medium mb-2">Confirm Password</label>
          <FloatLabel variant="in">
            <InputText
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              variant="filled"
              class="w-full h-12"
              @blur="validateConfirmPassword"
            />
            <label for="confirm-password">Confirm Password</label>
          </FloatLabel>
          <div v-if="confirmPassword.length > 0" class="mt-1">
            <span
              v-if="!passwordMismatch"
              class="text-green-600 text-sm"
            >
              ✔️ Passwords match
            </span>
            <span v-else class="text-red-600 text-sm">Passwords do not match</span>
          </div>
        </div>

        <!-- 条款和条件 -->
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <Checkbox id="terms" v-model="termsAccepted" class="mr-2" :binary="true" />
            <label for="terms" class="text-surface-900 dark:text-surface-0">I accept the terms and conditions</label>
          </div>
          <a class="font-medium text-primary cursor-pointer" @click="showTerms">Read Terms</a>
        </div>
      </div>

      <!-- 注册按钮 -->
      <div class="mt-6 w-full max-w-lg">
          <Button
            label="Register"
            icon="pi pi-user-plus"
            class="w-full"
            :disabled="!termsAccepted || passwordMismatch"
            @click="handleRegister"
            />
      </div>
      <div v-if="errorMessage" class="text-red-600 mt-4">{{ errorMessage }}</div>
      <div v-if="successMessage" class="text-green-600 mt-4">{{ successMessage }}</div>
    </div>

    <!-- 条款弹窗 -->
    <Dialog v-model:visible="termsDialogVisible" :style="{ width: '50vw' }" header="Terms and Conditions" :modal="true">
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
import axios from '@/axios'; // 导入 Axios
import { useRouter } from 'vue-router';

const roles = ref([
  { name: 'Teacher', value: 'teacher' },
  { name: 'Student', value: 'student' },
]);

const selectedRole = ref(''); // 用户选择的角色
const username = ref(''); // 用户名
const email = ref(''); // 邮箱
const password = ref(''); // 密码
const confirmPassword = ref(''); // 确认密码
const termsAccepted = ref(false); // 是否接受条款
const termsDialogVisible = ref(false); // 条款弹窗可见性
const errorMessage = ref<string>(''); // 错误信息
const successMessage = ref<string>(''); // 成功信息
const router = useRouter();

const passwordMismatch = computed(() => password.value !== confirmPassword.value);

const showTerms = () => {
  termsDialogVisible.value = true;
};

const agreeTerms = () => {
  termsAccepted.value = true;
  termsDialogVisible.value = false;
};

const goToLogin = () => {
  router.push('/login');
};

// 计算密码强度
const passwordStrength = computed(() => {
  const lengthCriteria = password.value.length >= 8;
  const numberCriteria = /[0-9]/.test(password.value);
  const specialCharCriteria = /[!@#$%^&*(),.?":{}|<>]/.test(password.value);
  const lowerUpperCaseCriteria = /[a-z]/.test(password.value) && /[A-Z]/.test(password.value);

  let strength = 0;
  if (lengthCriteria) strength++;
  if (numberCriteria) strength++;
  if (specialCharCriteria) strength++;
  if (lowerUpperCaseCriteria) strength++;

  return strength;
});

// 计算密码强度样式
const passwordStrengthStyle = computed(() => {
  const strength = passwordStrength.value;
  let width = '33%';
  let backgroundColor = 'bg-red-500';

  if (strength === 2) {
    width = '66%';
    backgroundColor = 'bg-blue-500';
  } else if (strength >= 3) {
    width = '100%';
    backgroundColor = 'bg-green-500';
  }

  return { width, backgroundColor };
});

const validateConfirmPassword = () => {
  if (passwordMismatch.value) {
    console.error('Passwords do not match.');
  }
};

// 注册处理函数
const handleRegister = async (): Promise<void> => {
  if (!username.value || !email.value || !password.value || !selectedRole.value) {
    errorMessage.value = 'Please fill in all fields';
    return;
  }

  if (passwordMismatch.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  try {
    const response = await axios.post('/register', {
      name: username.value,
      password: password.value,
      email: email.value,
      role: selectedRole.value.value,
    });

    if (response.data.code === 200) {
      // 注册成功，显示成功信息
      successMessage.value = response.data.info;
      errorMessage.value = '';
      alert('Registration successful!');
      // 跳转到登录页面
      goToLogin();
    } else {
      // 注册失败，显示错误信息
      errorMessage.value = response.data.info || 'Registration failed';
    }
  } catch (error) {
    // 处理网络错误或服务器错误
    errorMessage.value = 'Unable to connect to the server, please try again later';
    successMessage.value = '';
  }
};
</script>
