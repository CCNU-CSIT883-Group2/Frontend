<template>
  <div class="bg-surface-50 dark:bg-surface-950 w-screen flex items-center justify-center">
    <div
      class="bg-surface-0 dark:bg-surface-900 shadow-lg rounded-lg w-full max-w-6xl flex flex-col items-center p-6"
    >
      <!-- Main Content -->
      <div class="flex-1 md:mr-10">
        <div class="bg-surface-0 dark:bg-surface-950 p-2 w-[800px] rounded-lg">
          <div class="font-medium text-4xl text-surface-900 dark:text-surface-0 mb-6">
            User Dashboard
          </div>
          <div class="text-surface-500 dark:text-surface-300 mb-10">
            Manage your profile, track progress, and explore more features.
          </div>

          <!-- User Information Container -->
          <div class="bg-surface-100 dark:bg-surface-800 p-8 rounded-lg mb-6">
            <li class="flex items-center py-5 px-3 border-t border-surface flex-wrap">
              <div
                class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium text-lg"
              >
                Role
              </div>
              <div class="text-surface-900 dark:text-surface-0 w-full md:w-8/12">
                {{ user.role }}
              </div>
            </li>
            <!-- Name -->
            <li class="flex items-center py-5 px-3 border-t border-surface flex-wrap">
              <div
                class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium text-lg"
              >
                Name
              </div>
              <div
                v-if="!editingName"
                class="text-surface-900 dark:text-surface-0 w-full md:w-8/12"
              >
                {{ newName }}
              </div>
              <div v-else class="w-full md:w-8/12">
                <input-text v-model="newName" type="text" class="input-field w-full h-10 text-lg" />
              </div>
              <div class="w-6/12 md:w-2/12 flex justify-end">
                <Button
                  label="Edit"
                  icon="pi pi-pencil"
                  text
                  v-if="!editingName"
                  @click="toggleEdit('name')"
                />
                <Button label="Save" icon="pi pi-check" text v-else @click="saveNewName" />
              </div>
            </li>
            <!-- Email -->
            <li class="flex items-center py-5 px-3 border-t border-surface flex-wrap">
              <div
                class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium text-lg"
              >
                Email
              </div>
              <div
                v-if="!editingEmail"
                class="text-surface-900 dark:text-surface-0 w-full md:w-8/12"
              >
                {{ newEmail }}
              </div>
              <div v-else class="w-full md:w-8/12">
                <input-text
                  v-model="newEmail"
                  type="email"
                  class="input-field w-full h-10 text-lg"
                />
              </div>
              <div class="w-6/12 md:w-2/12 flex justify-end">
                <Button
                  label="Edit"
                  icon="pi pi-pencil"
                  text
                  v-if="!editingEmail"
                  @click="toggleEdit('email')"
                />
                <Button label="Save" icon="pi pi-check" text v-else @click="saveNewEmail" />
              </div>
            </li>

            <!-- New Password -->
            <li class="flex items-center py-5 px-3 border-t border-surface flex-wrap">
              <div
                class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium text-lg"
              >
                New Password
              </div>
              <div class="w-full md:w-8/12">
                <input-text
                  v-model="newPassword"
                  type="password"
                  class="input-field mb-3 h-10 w-full text-lg"
                  placeholder="New Password"
                  @input="checkPasswordStrength"
                />
              </div>
              <div v-if="newPassword.length > 0" class="mt-2 w-full md:w-8/12">
                <!-- Password Strength -->
                <div class="text-sm mb-2 flex items-center justify-center">Password Strength</div>
                <div class="h-2 rounded-full w-full bg-gray-200">
                  <div
                    :class="passwordStrengthStyle.backgroundColor"
                    :style="{ width: passwordStrengthStyle.width }"
                    class="h-full rounded-full"
                  ></div>
                </div>
              </div>
            </li>

            <!-- Confirm New Password -->
            <li class="flex items-center py-5 px-3 border-t border-surface flex-wrap">
              <div
                class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium text-lg"
              >
                Confirm Password
              </div>
              <div class="w-full md:w-8/12">
                <input-text
                  v-model="confirmPassword"
                  type="password"
                  class="input-field mb-3 w-full h-10 text-lg"
                  placeholder="Confirm Password"
                />
              </div>
              <div v-if="confirmPassword.length > 0" class="mt-1 w-full md:w-8/12">
                <!-- Password Match Status -->
                <span
                  v-if="newPassword === confirmPassword"
                  class="text-green-600 text-sm flex items-center justify-center"
                  >✔️ Passwords match</span
                >
                <span v-else class="text-red-600 text-sm flex items-center justify-center"
                  >Passwords do not match</span
                >
              </div>
            </li>
          </div>
          <!-- Submit and logout Button -->
          <div class="flex justify-center mt-4 space-x-4">
            <Button
              label="Save Changes"
              icon="pi pi-check"
              text
              :disabled="!canSavePassword"
              @click="saveAllChanges"
            />
            <Button
              label="Log Out"
              icon="pi pi-sign-out"
              text
              class="p-button-danger"
              @click="logout"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import axios from '@/axios'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import router from '@/router'

const { user } = storeToRefs(useUserStore())

// Define reactive variables for the new user information
const newName = ref(user.value.name)
const newEmail = ref(user.value.email)
const newPassword = ref('')
const confirmPassword = ref('')
const oldName = ref(user.value.name)

// Password strength logic
const passwordStrengthStyle = computed(() => {
  let strength = 0
  const length = newPassword.value.length
  if (length >= 8) strength += 1
  if (/[A-Z]/.test(newPassword.value)) strength += 1
  if (/[0-9]/.test(newPassword.value)) strength += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword.value)) strength += 1

  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500']
  const width = (strength / 4) * 100
  return { backgroundColor: colors[strength - 1] || 'bg-gray-200', width: `${width}%` }
})

// Validation for confirm password
const passwordsMatch = computed(() => newPassword.value === confirmPassword.value)

// Function to handle toggling edit state
const editingName = ref(false)
const editingEmail = ref(false)
const toggleEdit = (field: string): void => {
  if (field === 'name') editingName.value = !editingName.value
  if (field === 'email') editingEmail.value = !editingEmail.value
}

// Function to save name
const saveNewName = () => {
  user.value.name = newName.value // Update the store with the new name
  editingName.value = false
}

// Function to save email
const saveNewEmail = () => {
  user.value.email = newEmail.value // Update the store with the new email
  editingEmail.value = false
}

// Function to handle the save action for all changes
const saveAllChanges = async (): Promise<void> => {
  try {
    const data = {
      name: oldName.value,
      newname: newName.value == user.value.name ? newName.value : '',
      newemail: newEmail.value == user.value.email ? newEmail.value : '',
      newpassword: newPassword.value ? newPassword.value : '',
    }
    localStorage.setItem('name', newName.value)
    localStorage.setItem('email', newEmail.value)
    localStorage.setItem('role', user.value.role)
    console.log(data)
    // Make sure data isn't empty
    if (data.newname || data.newemail || data.newpassword) {
      const response = await axios.post('/profile', data)

      if (response.data.code === 200) {
        alert('User information saved successfully!')
        // Update the store with new data
        if (data.newname) user.value.name = data.newname
        if (data.newemail) user.value.email = data.newemail
        // Reset password fields
        newPassword.value = ''
        confirmPassword.value = ''
        router.push('/profile')
      } else {
        alert('Failed to save user information.')
      }
    }
  } catch (error) {
    console.error('Error saving user info:', error)
  }
}
//登出函数清除token,userstore信息以及localstorage信息
const logout = async () => {
  try {
    // 第一步：向后端发送登出请求
    const response = await axios.post('/logout', { token: user.value.token })

    if (response.data.code === 200) {
      // 第二步：手动重置 store 中的值
      const userStore = useUserStore()
      userStore.user.name = ''
      userStore.user.email = ''
      userStore.user.role = ''
      userStore.user.token = ''

      // 第三步：清除 localStorage 中的缓存数据
      localStorage.removeItem('name')
      localStorage.removeItem('email')
      localStorage.removeItem('role')
      localStorage.removeItem('token') // 确保清除 token

      // 第四步：重定向到入口页面
      router.push('/')
    } else {
      alert('登出失败')
    }
  } catch (error) {
    console.error('登出错误:', error)
    alert('登出过程中出现错误')
  }
}
// Function to handle the password strength
const checkPasswordStrength = () => {
  // You can add custom logic to handle password strength here if necessary
}

const canSavePassword = computed(
  () => newPassword.value && confirmPassword.value && passwordsMatch.value,
)
</script>
