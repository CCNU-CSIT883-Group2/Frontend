<template>
  <!-- 最外层容器，确保内容居中 -->
  <div class="bg-surface-50 dark:bg-surface-950 w-screen h-screen flex items-center justify-center">
    <div class="bg-surface-0 dark:bg-surface-900 p-12 shadow-lg rounded-lg w-full max-w-3xl">
      <!-- 内容 -->
      <div class="text-center mb-8">
        <svg class="mb-4 mx-auto fill-surface-600 dark:fill-surface-200 h-16" viewBox="0 0 30 32" fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd"
                d="M20.7207 6.18211L14.9944 3.11148L3.46855 9.28678L0.579749 7.73444L14.9944 0L23.6242 4.62977L20.7207 6.18211ZM14.9996 12.3574L26.5182 6.1821L29.4216 7.73443L14.9996 15.4621L6.37724 10.8391L9.27337 9.28677L14.9996 12.3574ZM2.89613 16.572L0 15.0196V24.2656L14.4147 32V28.8953L2.89613 22.7132V16.572ZM11.5185 18.09L0 11.9147V8.81001L14.4147 16.5376V25.7904L11.5185 24.2312V18.09ZM24.2086 15.0194V11.9147L15.5788 16.5377V31.9998L18.475 30.4474V18.09L24.2086 15.0194ZM27.0969 22.7129V10.3623L30.0004 8.81V24.2653L21.3706 28.895V25.7904L27.0969 22.7129Z" />
        </svg>

        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome ChatCNU</div>
        <span class="text-surface-600 dark:text-surface-200 font-medium leading-normal">Please retrieve your password</span>
        </div>

          <!-- <div class="text-center mb-4">
              <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
                  {{ isRecovering ? '找回密码' : '修改密码' }}
              </div>
          </div> -->

          <div class="space-y-2 w-full mt-2">
              <FloatLabel variant="in" class="mb-2" v-if="isRecovering">
                  <InputText id="Email" v-model="email" variant="filled" class="w-full" />
                  <label for="email" >Email</label>
              </FloatLabel>
         </div>
          <div class="space-y-2 w-full">
              <FloatLabel variant="in" class="mt-4" v-if="isRecovering">
                  <InputText id="verificationCode" v-model="verificationCode" variant="filled" class="w-full " />
                  <label for="verificationCode" class="-mt-6">Verification Code</label>

                  <div class="flex items-center mt-2">
                      <Button label="Send verification code" @click="sendVerificationCode" :disabled="isSending" class="ml-2" />
                      <span v-if="countdown > 0">{{ countdown }} seconds can resend it</span>
                  </div>
              </FloatLabel>

              <Button label="Retrieve Password" v-if="isRecovering" @click="verifyCode" class="w-full mb-4" />

              <FloatLabel variant="in" class="mb-4" v-else>
                  <InputText id="newPassword" v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" variant="filled" class="w-full" />
                  <label for="newPassword">新密码</label>
                  <div class="flex items-center mt-2">
                      <Button icon="pi pi-eye" @click="toggleNewPassword" class="mr-2" />
                      <span>密码强度：{{ getPasswordStrength(newPassword) }}</span>
                  </div>
              </FloatLabel>

              <FloatLabel variant="in" class="mb-4" v-else>
                  <InputText id="confirmPassword" v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" variant="filled" class="w-full" />
                  <label for="confirmPassword">Confirm Password</label>
              </FloatLabel>

              <div v-if="passwordMismatch" class="text-red-600 mb-2">密码不一致，请重新输入。</div>

              <Button label="Confirm Modification" v-if="!isRecovering" @click="confirmModification" class="w-full" />
          </div>
      </div>
  </div>
</template>



<script lang="ts">
  export default {
  data() {
      return {
          email: '',
          verificationCode: '',
          countdown: 0,
          isSending: false,
          isRecovering: true,
          newPassword: '',
          confirmPassword: '',
          showNewPassword: false,
          showConfirmPassword: false,
      };
  },
  computed: {
      passwordMismatch() {
          return this.newPassword && this.confirmPassword && this.newPassword !== this.confirmPassword;
      },
  },
  methods: {
      sendVerificationCode() {
          this.isSending = true;
          this.countdown = 60;
          const interval = setInterval(() => {
              if (this.countdown > 0) {
                  this.countdown--;
              } else {
                  clearInterval(interval);
                  this.isSending = false;
              }
          }, 1000);
          console.log('验证码已发送至', this.email);
      },
      verifyCode() {
          if (this.verificationCode === '123456') { // 假设验证码为123456
              console.log('验证码验证通过');
              this.isRecovering = false; // 进入修改密码界面
          } else {
              alert('验证码错误，请重试。');
          }
      },
      toggleNewPassword() {
          this.showNewPassword = !this.showNewPassword;
      },
      toggleConfirmPassword() {
          this.showConfirmPassword = !this.showConfirmPassword;
      },
      confirmModification() {
          if (this.passwordMismatch) {
              return;
          }
          console.log('修改密码', this.newPassword);
          // 跳转到登录界面
          this.$router.push('/login');
      },
      getPasswordStrength(password) {
          if (password.length < 6) return '弱';
          if (password.length < 10) return '中';
          return '强';
      },
  },
};
</script>

<style scoped>
.bg-surface-50 {
  background-color: #f9f9f9;
}

.bg-surface-0 {
  background-color: #ffffff;
}

.text-surface-900 {
  color: #1f2937;
}

.text-red-600 {
  color: #dc2626;
}
</style>
