<template>
  <div :class="{ 'dark-mode': isDarkMode }" class="main-container">
    <div class="info-section">
      <!-- 这里可以添加额外的信息展示 -->
    </div>

    <div class="chart-section">


      <!-- 分享按钮 -->
      <div class="share-button">
        <button @click="shareContent">Share </button>
      </div>

      <div class="subject-selector">
        <label for="subjects">Select subject:</label>
        <select id="subjects" v-model="selectedSubject" @change="handleSubjectChange">
          <option v-for="subject in subjects" :key="subject" :value="subject">
            {{ subject }}
          </option>
        </select>
      </div>

      <!-- 折线图 -->
      <div class="line-chart">
        <div class="chart-container">
          <Chart type="line" :data="lineChartData" :options="lineChartOptions"  />
        </div>
      </div>
      <!-- 饼图 -->
      <div class="pie-chart-container">
        <div class="pie-chart">
          <Chart type="pie" :data="pieChartData" :options="pieChartOptions"  />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Chart from 'primevue/chart';
import axios from 'axios';

// 导入路由
const route = useRoute();
const router = useRouter();



// 科目数据
const subjects = ref(['CS', 'OS', 'CN', 'DS']);
const selectedSubject = ref(route.query.subjects || 'CS'); // 默认选中的科目

// 当前用户名
const username = ref(route.query.username || 'cyyyx');

// 处理科目选择事件
const handleSubjectChange = () => {
  // 使用 Vue Router 的 push 方法进行跳转，并传递科目和用户名作为查询参数
  router.push({
    name: 'overview', // 目标路由的名称
    query: {
      subjects: selectedSubject.value,  // 传递选择的科目
      username: username.value // 传递用户名
    }
  });
};

// 分享功能
const shareContent = () => {
  if (navigator.share) {
    navigator.share({
      title: 'Share My Statistics',
      text: `Check out my stats for ${selectedSubject.value}!`,
      url: window.location.href, // 当前页面的 URL
    })
      .then(() => console.log('Share was successful!'))
      .catch((error) => console.log('Sharing failed', error));
  } else {
    // 如果浏览器不支持原生分享API，可以提供一个链接或者其他方式分享
    alert('Sharing is not supported in your browser. You can copy the URL and share manually.');
  }
};

// 用于保存图表的数据和选项
const lineChartData = ref({});
const lineChartOptions = ref({});
const pieChartData = ref({});
const pieChartOptions = ref({});

// 获取图表数据
const fetchChartData = async () => {
  try {
    const response = await axios.get(`http://server.lzzzt.cn:8000/statistics`, { params: { username: username.value, subject: selectedSubject.value } });
    const dailyStatistics = response.data.data.daily_statistics;

    // 检查返回的数据结构是否符合预期
    if (dailyStatistics.length === 0) {
      console.warn('No daily statistics data available.');
      return;
    }

    // 提取正确率数据并更新折线图
    const accuracyData = dailyStatistics.map((entry) => entry.correct_rate || 0);
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
    };

    // 更新饼图数据
    const correctData = subjects.value.map((subject, index) => {
      const entry = dailyStatistics[index % dailyStatistics.length];
      return {
        subject: subject,
        correctRate: entry ? entry.correct_rate : 0,
      };
    });
    pieChartData.value = {
      labels: subjects.value,
      datasets: [
        {
          label: 'Error Rate (%)',
          data: correctData.map((item) => 100 - item.correctRate), // 错题比例 = 100% - 正确率
          backgroundColor: ['#FF8C97', '#5F91C4', '#FFB732', '#65B3A1'],
          hoverBackgroundColor: ['#FFB2C3', '#7DAFDC', '#FFCF6D', '#80C9B5'],
        },
      ],
    };

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
              size: 18,  // 设置标题的字体大小
              weight: 'bold',  // 设置字体的粗细
            },
            padding: {
              bottom: 20,  // 设置标题下方的间距
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
    };

    pieChartOptions.value = {
      plugins: {
        title: {
          display: true,
          text: 'Percentage of Wrong Questions in Each Subject (%)', // 设置标题内容
          font: {
            size: 18,  // 设置标题的字体大小
            weight: 'bold',  // 设置字体的粗细
          },
          padding: {
            bottom: 20,  // 设置标题下方的间距
          },
        },
        legend: {
          position: 'top',
        },
      },
    };
  } catch (error) {
    console.error('Failed to fetch chart data:', error);
  }
};

// 页面加载时初始化图表数据
onMounted(() => {
  fetchChartData();
  const urlParams = new URLSearchParams(window.location.search);
  username.value = urlParams.get('username') || 'cyyyx';
  subjects.value = new URLSearchParams(window.location.search).get('subject') || ['CS', 'OS', 'CN', 'DS'];
  console.log('Selected Subject:', subjects.value);
});

// 监听科目变化，更新图表
watch(selectedSubject, () => {
  fetchChartData();
});
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
  height:50%;
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
