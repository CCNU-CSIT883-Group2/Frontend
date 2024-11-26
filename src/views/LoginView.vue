<template>
  <div class="bg-surface-50 dark:bg-surface-950 w-screen h-screen flex items-center justify-center">
    <div class="bg-surface-0 dark:bg-surface-900 p-12 shadow-lg rounded-lg w-full max-w-3xl">
      <div class="text-center mb-8">
        <svg class="mb-4 mx-auto fill-surface-600 dark:fill-surface-200 h-16" viewBox="0 0 30 32" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd"
            d="M20.7207 6.18211L14.9944 3.11148L3.46855 9.28678L0.579749 7.73444L14.9944 0L23.6242 4.62977L20.7207 6.18211ZM14.9996 12.3574L26.5182 6.1821L29.4216 7.73443L14.9996 15.4621L6.37724 10.8391L9.27337 9.28677L14.9996 12.3574ZM2.89613 16.572L0 15.0196V24.2656L14.4147 32V28.8953L2.89613 22.7132V16.572ZM11.5185 18.09L0 11.9147V8.81001L14.4147 16.5376V25.7904L11.5185 24.2312V18.09ZM24.2086 15.0194V11.9147L15.5788 16.5377V31.9998L18.475 30.4474V18.09L24.2086 15.0194ZM27.0969 22.7129V10.3623L30.0004 8.81V24.2653L21.3706 28.895V25.7904L27.0969 22.7129Z" />
        </svg>

        <div class="text-surface-900 dark:text-surface-0 text-4xl font-medium mb-4">Welcome ChatCNU</div>
        <span class="text-surface-600 dark:text-surface-200 font-medium leading-normal">Don't have an account?</span>
        <a class="font-medium no-underline ml-2 text-primary cursor-pointer" @click="handregister">Create today!</a>
      </div>

      <div>
        <label for="email1" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">Name</label>
        <InputText id="email1" type="text" placeholder="Email address" class="w-full mb-4" v-model="name" />

        <label for="password1" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">Password</label>
        <InputText id="password1" type="password" placeholder="Password" class="w-full mb-4" v-model="password" />

        <div v-if="errorMessage" class="text-red-600 mb-4">{{ errorMessage }}</div>

        <div class="flex items-center justify-between mb-12">
          <div class="flex items-center">
            <Checkbox id="rememberme1" v-model="rememberMe" :binary="true" class="mr-2" />
            <label for="rememberme1">Remember me</label>
          </div>
          <a class="font-medium no-underline ml-2 text-primary text-right cursor-pointer" @click="handbackpassword" >Forgot password?</a>
        </div>

        <Button label="Sign In" icon="pi pi-user" class="w-full" @click="handleLogin" />

        <div class="text-center mt-4">
          <span class="text-surface-600 dark:text-surface-200">Or sign in with:</span>
          <div class="flex justify-center mt-2">
            <Button label="Google" icon="pi pi-google" class="mr-2" />
            <Button label="Facebook" icon="pi pi-facebook" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from '@/axios';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

// 定义表单相关数据
const name=ref<string>(''); // 用户输入的用户名
const email = ref<string>(''); // 用户输入的邮箱
const password = ref<string>(''); // 用户输入的密码
const rememberMe = ref<boolean>(false); // 是否勾选记住我
const errorMessage = ref<string>(''); // 登录失败提示信息
const router = useRouter();

// 登录处理逻辑
const handleLogin = async (): Promise<void> => {
  if (!name.value || !password.value) {
    errorMessage.value = 'Please fill in all fields';
    return;
  }

  try {
    const response = await axios.post('/login', {
      name: name.value,
      password: password.value,
    });

    if (response.data.code === 200) {
      // 登录成功，保存 token 到 localStorage
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('username',(name.value));
      console.log(response.data.data)

      const user = useUserStore()
      user.user.token = response.data.data.token
      user.user.name = response.data.data.User.name
      user.user.uid = response.data.data.User.UID

      alert('Login successful!');
      errorMessage.value = '';
      // 跳转到主页
      router.push('/profile');
    } else {
      // 登录失败，显示错误信息
      errorMessage.value = response.data.info || 'Invalid email or password';
    }
  } catch (error) {
    console.error('Login failed:', error);
    // 错误处理
    errorMessage.value = 'Unable to connect to the server, please try again later';
  }
};

// 找回密码处理
const handbackpassword = (): void => {
  // 清除任何错误消息
  errorMessage.value = '';
  // 跳转到找回密码页面
  router.push('/backpassword');
};

// 注册处理
const handregister = (): void => {
  // 清除任何错误消息
  errorMessage.value = '';
  // 跳转到注册页面
  router.push('/register');
};
</script>

<style scoped>
/* 自定义样式可在此处添加 */
</style>
