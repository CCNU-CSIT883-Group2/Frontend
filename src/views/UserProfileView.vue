<template>
  <div class="bg-surface-0 dark:bg-surface-950 p-10 md:p-20 flex flex-col md:flex-row">
    <!-- Main Content -->
    <div class="flex-1 md:mr-8">
      <div class="bg-surface-0 dark:bg-surface-950">
        <div class="font-medium text-3xl text-surface-900 dark:text-surface-0 mb-4">User Dashboard</div>
        <div class="text-surface-500 dark:text-surface-300 mb-8">Manage your profile, track progress, and explore more features.</div>

        <!-- User Information Container -->
        <div class="bg-surface-100 dark:bg-surface-800 p-6 rounded-lg mb-8">
          <div class="font-medium text-2xl text-surface-900 dark:text-surface-0 mb-4">User Information</div>
          <ul class="list-none p-0 m-0">
            <!-- Name -->
            <li class="flex items-center py-4 px-2 border-t border-surface flex-wrap">
              <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium">Name</div>
              <div v-if="!editingName" class="text-surface-900 dark:text-surface-0 w-full md:w-8/12 md:order-none order-1">
                {{ user.name }}
              </div>
              <div v-else class="w-full md:w-8/12 md:order-none order-1">
                <input v-model="user.name" type="text" class="input-field" />
              </div>
              <div class="w-6/12 md:w-2/12 flex justify-end">
                <Button label="Edit" icon="pi pi-pencil" text v-if="!editingName" @click="toggleEdit('name')" />
                <Button label="Save" icon="pi pi-check" text v-else @click="toggleEdit('name')" />
              </div>
            </li>
            <!-- Phone -->
            <li class="flex items-center py-4 px-2 border-t border-surface flex-wrap">
              <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium">Phone</div>
              <div v-if="!editingPhone" class="text-surface-900 dark:text-surface-0 w-full md:w-8/12 md:order-none order-1">
                {{ user.phone }}
              </div>
              <div v-else class="w-full md:w-8/12 md:order-none order-1">
                <input v-model="user.phone" type="text" class="input-field" />
              </div>
              <div class="w-6/12 md:w-2/12 flex justify-end">
                <Button label="Edit" icon="pi pi-pencil" text v-if="!editingPhone" @click="toggleEdit('phone')" />
                <Button label="Save" icon="pi pi-check" text v-else @click="toggleEdit('phone')" />
              </div>
            </li>
            <!-- Email -->
            <li class="flex items-center py-4 px-2 border-t border-surface flex-wrap">
              <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium">Email</div>
              <div v-if="!editingEmail" class="text-surface-900 dark:text-surface-0 w-full md:w-8/12 md:order-none order-1">
                {{ user.email }}
              </div>
              <div v-else class="w-full md:w-8/12 md:order-none order-1">
                <input v-model="user.email" type="email" class="input-field" />
              </div>
              <div class="w-6/12 md:w-2/12 flex justify-end">
                <Button label="Edit" icon="pi pi-pencil" text v-if="!editingEmail" @click="toggleEdit('email')" />
                <Button label="Save" icon="pi pi-check" text v-else @click="toggleEdit('email')" />
              </div>
            </li>
            <!-- Password -->
            <li class="flex items-center py-4 px-2 border-t border-surface flex-wrap">
              <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium">Password</div>
              <div class="w-full md:w-8/12 md:order-none order-1">
                <!-- Old Password Input -->
                <div v-if="!oldPasswordVerified">
                  <input v-model="oldPassword" type='password' class="input-field mb-2" placeholder="Old Password" @blur="verifyOldPassword" />
                  <div v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</div>
                </div>
                <!-- New Password and Confirm Password Inputs -->
                <div v-else>
                  <div>
                    <label for="new-password" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">New Password</label>
                    <input id="new-password" v-model="newPassword" type='password' class="input-field mb-2" placeholder="new-password" @input="checkPasswordStrength" />
                  </div>
                  <div v-if="newPassword.length > 0" class="mt-2">
                    <div class="text-sm mb-2">Password Strength</div>
                    <div class="h-2 rounded-full w-full bg-gray-200">
                      <div :class="passwordStrengthStyle.backgroundColor" :style="{ width: passwordStrengthStyle.width }" class="h-full rounded-full"></div>
                    </div>
                  </div>
                  <div class="mt-4">
                    <label for="confirm-password" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">Confirm Password</label>
                    <input type='password' id="confirm-password" v-model="confirmPassword" class="input-field mb-2" placeholder="confirm-password" @blur="validateConfirmPassword" />
                  </div>
                  <div v-if="confirmPassword.length > 0" class="mt-1">
                    <span v-if="newPassword === confirmPassword" class="text-green-600 text-sm">✔️ Passwords match</span>
                    <span v-else class="text-red-600 text-sm">Passwords do not match</span>
                  </div>
                </div>
              </div>
              <div class="w-6/12 md:w-2/12 flex justify-end">
                <Button label="Save" icon="pi pi-check" text :disabled="!canSavePassword" @click="saveNewPassword" />
              </div>
            </li>
          </ul>
        </div>

        <!-- Actionable Items -->
        <ul class="list-none p-0 m-0">
          <!-- Data Analysis -->
          <li class="flex items-center py-4 px-2 border-t border-surface flex-wrap">
            <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium">Data Analysis</div>
            <div class="text-surface-900 dark:text-surface-0 w-full md:w-8/12 md:order-none order-1">
              Explore your detailed statistics and progress.
            </div>
            <div class="w-6/12 md:w-2/12 flex justify-end">
              <Button label="View Analysis" icon="pi pi-chart-bar" text @click="navigateTo('/data-analysis')" />
            </div>
          </li>
          <!-- Favorites -->
          <li class="flex items-center py-4 px-2 border-t border-surface flex-wrap">
            <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium">Favorites</div>
            <div class="text-surface-900 dark:text-surface-0 w-full md:w-8/12 md:order-none order-1">
              Check out your saved questions and articles.
            </div>
            <div class="w-6/12 md:w-2/12 flex justify-end">
              <Button label="View Favorites" icon="pi pi-bookmark" text @click="navigateTo('/favorites')" />
            </div>
          </li>
          <!-- Feedback -->
          <li class="flex items-center py-4 px-2 border-t border-b border-surface flex-wrap">
            <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium">Feedback</div>
            <div class="text-surface-900 dark:text-surface-0 w-full md:w-8/12 md:order-none order-1">
              Have any issues? Send us your feedback.
            </div>
            <div class="w-6/12 md:w-2/12 flex justify-end">
              <Button label="Send Feedback" icon="pi pi-envelope" text @click="navigateTo('/feedback')" />
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Statistics Overview Sidebar -->
    <div class="bg-surface-100 dark:bg-surface-800 p-6 rounded-lg  w-full md:w-4/12">
      <div class="font-medium text-2xl text-surface-900 dark:text-surface-0 mb-4">Statistics Overview</div>
      <ul class="list-none p-0 m-0">
        <!-- Total Questions -->
        <li class="flex items-center py-4 px-2 border-t border-surface flex-wrap">
          <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-6/12 font-medium">Total Questions</div>
          <div class="text-surface-900 dark:text-surface-0 w-full md:w-6/12 md:order-none order-1">
            <Badge :value="totalQuestions" severity="info" style="font-size: 1.2rem;" />
          </div>
        </li>
        <!-- Total Days -->
        <li class="flex items-center py-4 px-2 border-t border-surface flex-wrap">
          <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-6/12 font-medium">Total Days</div>
          <div class="text-surface-900 dark:text-surface-0 w-full md:w-6/12 md:order-none order-1">
            <Badge :value="totalDays" severity="success" style="font-size: 1.2rem;" />
          </div>
        </li>
        <!-- Chart Container -->
        <div class="main">
          <div class="chart-container">
            <div ref="chartRef" class="chart"></div>
          </div>
        </div>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import * as echarts from 'echarts';

const editingPhone = ref(false);
const editingEmail = ref(false);
const editingName = ref(false);

const toggleEdit = (field: string): void => {
  if (field === 'phone') editingPhone.value = !editingPhone.value;
  if (field === 'email') editingEmail.value = !editingEmail.value;
  if (field === 'name') editingName.value = !editingName.value;

  if (!editingPhone.value && !editingEmail.value && !editingName.value) {
    saveUserInfo(); // Call save logic when toggling off edit mode
  }
};

interface User {
  UID: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

const user = ref<User>({ UID: '', name: '', phone: '', email: '', role: '' });
const totalQuestions = ref<number>(520);
const totalDays = ref<number>(120);
const chartRef = ref(null);
const chartInstance = ref(null);

const fetchUserInfo = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:4523/m1/5366543-5038617-default/profile');
    if (response.data.code === 200) {
      user.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
};

const saveUserInfo = async (): Promise<void> => {
  try {
    const response = await axios.post('http://127.0.0.1:4523/m1/5366543-5038617-default/profile', user.value);
    if (response.data.code === 200) {
      alert('User information saved successfully!');
    } else {
      alert('Failed to save user information. Please try again later.');
    }
  } catch (error) {
    console.error('Error saving user info:', error);
    alert('Error saving user info. Please try again later.');
  }
};

const initChart = () => {
  if (chartRef.value) {
    chartInstance.value = echarts.init(chartRef.value);
    const options = {
      title: {
        text: '',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
      },
      legend: {
        data: ['Multiple Choice', 'True/False', 'Easy', 'Medium', 'Hard'],
      },
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {},
          magicType: {
            type: ['line', 'bar', 'stack', 'tiled'],
          },
          restore: {},
        },
        top: 'bottom',
      },
      xAxis: {
        type: 'category',
        data: ['Multiple Choice', 'True/False', 'Easy', 'Medium', 'Hard'],
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: 'Multiple Choice',
          type: 'bar',
          data: [0, 0, 0, 0, 0],
        },
        {
          name: 'True/False',
          type: 'bar',
          data: [0, 0, 0, 0, 0],
        },
        {
          name: 'Easy',
          type: 'bar',
          data: [0, 0, 0, 0, 0],
        },
        {
          name: 'Medium',
          type: 'bar',
          data: [0, 0, 0, 0, 0],
        },
        {
          name: 'Hard',
          type: 'bar',
          data: [0, 0, 0, 0, 0],
        },
      ],
    };
    chartInstance.value.setOption(options);
    window.addEventListener('resize', () => {
      chartInstance.value.resize();
    });
  }
};

const fetchChartData = async () => {
  try {
    const response = await axios.get('https://opentdb.com/api.php?amount=10&type=multiple&boolean=true');
    const quizResults = response.data.results;

    const typeCount = {
      multiple: 0,
      boolean: 0,
    };

    const difficultyCount = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    quizResults.forEach((item) => {
      if (item.type === 'multiple') {
        typeCount.multiple += 1;
      } else if (item.type === 'boolean') {
        typeCount.boolean += 1;
      }

      if (item.difficulty === 'easy') {
        difficultyCount.easy += 1;
      } else if (item.difficulty === 'medium') {
        difficultyCount.medium += 1;
      } else if (item.difficulty === 'hard') {
        difficultyCount.hard += 1;
      }
    });

    if (chartInstance.value) {
      chartInstance.value.setOption({
        series: [
          {
            name: 'Multiple Choice',
            data: [typeCount.multiple, 0, 0, 0, 0],
          },
          {
            name: 'True/False',
            data: [typeCount.boolean, 0, 0, 0, 0],
          },
          {
            name: 'Easy',
            data: [0, 0, difficultyCount.easy, 0, 0],
          },
          {
            name: 'Medium',
            data: [0, 0, 0, difficultyCount.medium, 0],
          },
          {
            name: 'Hard',
            data: [0, 0, 0, 0, difficultyCount.hard],
          },
        ],
      });
    }
  } catch (error) {
    console.error('Error fetching quiz data:', error);
  }
};

onMounted(() => {
  fetchUserInfo();
  initChart();
  fetchChartData();
});
</script>

<style scoped>
.input-field {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  margin-top: 0.25rem;
  position: relative;
}
.chart-container {
  position: absolute;
  bottom: 50%;
  right: 10px;
  width: 35%;
  height: 35%;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  padding: 10px;
}
.chart {
  width: 100%;
  height: 100%;
}
</style>
