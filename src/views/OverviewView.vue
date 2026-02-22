<template>
  <div :class="{ 'dark-mode': isDarkMode }" class="main-container">
    <div class="info-section">
      <!-- 这里可以添加额外的信息展示 -->
    </div>

    <div class="chart-section">
      <!-- 分享按钮 -->
      <div class="share-button">
        <button @click="shareContent">Share</button>
      </div>

      <div class="subject-selector">
        <label for="subjects"></label>
        <Select
          id="subjects"
          v-model="selectedSubject"
          @change="handleSubjectChange"
          placeholder="Select subject"
          :options="subjects"
        >
          <option v-for="subject in subjects" :key="subject" :value="subject">
            {{ subject }}
          </option>
        </Select>
      </div>

      <!-- 折线图 -->
      <div class="line-chart">
        <div class="chart-container">
          <Chart type="line" :data="lineChartData" :options="lineChartOptions" />
        </div>
      </div>
      <!-- 饼图 -->
      <div class="pie-chart-container">
        <div class="pie-chart">
          <Chart type="pie" :data="pieChartData" :options="pieChartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Chart from 'primevue/chart'
import axios from '@/axios'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'
import { storeToRefs } from 'pinia'
import type { DailyStatistics, Response, StatisticsData } from '@/types'

// 导入路由
const route = useRoute()
const router = useRouter()
const isDarkMode = ref(false)

// 科目数据
// const subjects = ref([]);
const selectedSubject = ref((route.query.subjects as string) || '') // 默认选中的科目

const historyStore = useQuestionHistoryStore()
const { subjects } = storeToRefs(historyStore)

// 获取历史记录并提取科目列表
const fetchSubjectsFromHistory = async () => {
  try {
    historyStore.fetch() // 获取历史记录

    // 使用 watch 来监听 subjects 的变化并设置默认选中的科目
    watch(subjects, (newSubjects) => {
      if (newSubjects.length > 0 && !selectedSubject.value) {
        selectedSubject.value = newSubjects[0] // 如果没有选择科目，则默认选择第一个科目
      }
    })
  } catch (error) {
    console.error('Failed to fetch subjects:', error)
  }
}
// 当前用户名
const username = ref(localStorage.getItem('username') || '')

// 处理科目选择事件
const handleSubjectChange = () => {
  // 使用 Vue Router 的 push 方法进行跳转，并传递科目和用户名作为查询参数
  router.push({
    name: 'overview', // 目标路由的名称
    query: {
      subjects: selectedSubject.value, // 传递选择的科目
      username: username.value, // 传递用户名
    },
  })
}

// 分享功能
const shareContent = () => {
  if (navigator.share) {
    navigator
      .share({
        title: 'Share My Statistics',
        text: `Check out my stats for ${selectedSubject.value}!`,
        url: window.location.href, // 当前页面的 URL
      })
      .then(() => console.log('Share was successful!'))
      .catch((error) => console.log('Sharing failed', error))
  } else {
    // 如果浏览器不支持原生分享API，可以提供一个链接或者其他方式分享
    alert('Sharing is not supported in your browser. You can copy the URL and share manually.')
  }
}

// 用于保存图表的数据和选项
const lineChartData = ref<Record<string, unknown>>({})
const lineChartOptions = ref<Record<string, unknown>>({})
const pieChartData = ref<Record<string, unknown>>({})
const pieChartOptions = ref<Record<string, unknown>>({})

const fetchChartData = async () => {
  if (!selectedSubject.value || !username.value) return

  try {
    const response = await axios.get<Response<StatisticsData>>('/statistics', {
      params: {
        username: username.value,
        subject: selectedSubject.value,
      },
    })
    const dailyStatistics = response.data.data.daily_statistics

    // 检查返回的数据结构是否符合预期
    if (dailyStatistics.length === 0) {
      console.warn('No daily statistics data available.')
      return
    }

    // 用于保存各科目的总刷题数
    const subjectTotalAttempts: Record<string, number> = {}

    // 假设 subjects 是一个响应式引用（例如 ref）
    for (let i = 0; i < subjects.value.length; i++) {
      const subject = subjects.value[i] as string

      try {
        // 发起请求获取该科目的刷题总数
        const subjectResponse = await axios.get<Response<StatisticsData>>('/statistics', {
          params: { subject: subject, username: username.value },
        })
        const dailyStatistics1 = subjectResponse.data.data.daily_statistics

        // 获取该科目的 total_attempts
        const totalAttempts = dailyStatistics1.reduce((total: number, stat: DailyStatistics) => {
          return total + stat.total_attempts // 累加每个日期的刷题数
        }, 0)

        // 如果该科目没有记录，则初始化为 0
        if (!subjectTotalAttempts[subject]) {
          subjectTotalAttempts[subject] = 0
        }

        // 累加每个科目的 total_attempts
        subjectTotalAttempts[subject] += totalAttempts
      } catch (error) {
        console.error(`Failed to fetch data for subject ${subject}:`, error)
      }
    }

    // 打印累加后的结果
    // 计算总刷题数
    const totalAttempts = Object.values(subjectTotalAttempts).reduce(
      (total, attempts) => total + attempts,
      0,
    )
    // 计算各科目的刷题比例
    const subjectPercentages = subjects.value.map((subject) => {
      const attempts = subjectTotalAttempts[subject] || 0
      if (totalAttempts === 0) return 0
      return (attempts / totalAttempts) * 100 // 计算比例
    })

    // 提取正确率数据并更新折线图
    const accuracyData = dailyStatistics.map((entry) => entry.correct_rate * 100 || 0)
    lineChartData.value = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Correct Rate (%)',
          data: accuracyData,
          borderColor: '#42A5F5',
          fill: false,
          tension: 0.4,
        },
      ],
    }

    pieChartData.value = {
      labels: subjects.value,

      datasets: [
        {
          label: 'Attempts (%)',

          // data: topSubjects.map(subject => (1 - subject.correctRate) * 100), // 错题比例 = 100% - 正确率
          data: subjectPercentages,
          backgroundColor: ['#FF8C97', '#5F91C4', '#FFB732', '#65B3A1'],
          hoverBackgroundColor: ['#FFB2C3', '#7DAFDC', '#FFCF6D', '#80C9B5'],
        },
      ],
    }

    // 更新图表选项
    lineChartOptions.value = {
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Accuracy (%) Of ' + selectedSubject.value + ' During the Last 7 Days',
            font: {
              size: 18, // 设置标题的字体大小
              weight: 'bold', // 设置字体的粗细
            },
            padding: {
              bottom: 20, // 设置标题下方的间距
            },
          },
        },
        y: {
          title: {
            display: true,
            text: 'Correct Rate (%)',
          },
          min: 0,
          max: 100,
        },
      },
    }

    pieChartOptions.value = {
      plugins: {
        title: {
          display: true,
          text: 'Percentage of Attempts in Each Subject (%)', // 设置标题内容
          font: {
            size: 18, // 设置标题的字体大小
            weight: 'bold', // 设置字体的粗细
          },
          padding: {
            bottom: 20, // 设置标题下方的间距
          },
        },
        legend: {
          position: 'top',
        },
      },
    }
  } catch (error) {
    console.error('Failed to fetch chart data:', error)
  }
}

// 页面加载时初始化图表数据
onMounted(() => {
  fetchSubjectsFromHistory() // 获取科目列表
  fetchChartData() // 获取图表数据
  const urlParams = new URLSearchParams(window.location.search)
  // username.value = urlParams.get('username') || 'cyyyx';
  selectedSubject.value = urlParams.get('subjects') || (subjects.value[0] as string) // 设置科目
})

// 监听科目变化，更新图表
watch(selectedSubject, () => {
  fetchChartData()
})

//
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: 100vh;
  gap: 20px;
  width: 100%;
}

.chart-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  gap: 20px;
}

.subject-selector {
  display: flex;
  align-items: center;
  gap: 10px;

  border-radius: 5px;
}

.chart-container {
  flex: 1;
  padding: 20px;
  width: 50%;

  height: 500%;
  justify-content: center;
  align-items: center;
}

.pie-chart {
  flex: 1;
  padding: 20px;
  width: 25%;

  height: 25%;
  justify-content: center;
  align-items: center;
}

.line-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 50%;
  gap: 20px;
}

.pie-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 50%;
  gap: 20px;
}

canvas {
  width: 100%;
  height: 100%;
}

.theme-toggle {
  margin-bottom: 10px;
  position: absolute;
  top: 5px;
  right: 5px;
}

.share-button {
  margin-bottom: 20px;
  position: absolute;
  bottom: 5px;
  right: 5px;
}

/* 亮模式下的按钮样式 */
button {
  background-color: #0073ff;
  /* 默认蓝色 */
  color: white;
  border-radius: 5px;
  cursor: pointer;
  opacity: 0.9;
}

button:hover {
  background-color: #0056b3;
  /* 鼠标悬停时的深蓝色 */
  transform: scale(1.05);
  /* 按钮悬停时放大 */
}

button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5);
  /* 聚焦时的蓝色光环 */
}

/* 暗模式下的按钮样式 */
.dark-mode button {
  background-color: #6c757d;
  /* 暗模式下的按钮背景色 */
  color: #f8f9fa;
  /* 暗模式下的按钮文字颜色 */
}

.dark-mode button:hover {
  background-color: #5a6268;
  /* 鼠标悬停时的按钮背景色 */
  transform: scale(1.05);
  /* 按钮悬停时放大 */
}

/* 分享按钮样式 */
.share-button button {
  background-color: #28a76a;
  /* 分享按钮的绿色背景色 */
  color: white;
}
</style>
