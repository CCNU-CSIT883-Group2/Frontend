# Overview Dashboard API 文档

## 1. 目标
`Overview` 已升级为 dashboard，前端当前支持并展示以下模块：

- KPI 卡片（Accuracy / Attempts / Active Days / Subject Ranking）
- Accuracy Trend（折线图）
- Correct vs Incorrect（堆叠柱状图）
- Subject Accuracy Ranking（横向条形图）
- Attempt Distribution（环形图）
- Smart Insights（洞察列表）

为支撑这些能力，接口分为两类：

- 现有接口（已可用）
- 建议新增接口（减少前端多次请求，支持更多扩展数据）

---

## 2. 现有接口（已可直接支持）

### 2.1 获取用户历史（用于 subject 列表）

- Method: `GET`
- Path: `/history`
- Query:
  - `username: string` (required)
- Header:
  - `AUTHORIZATION: string` (required)

Response (`200`):

```json
{
  "code": 200,
  "info": "ok",
  "data": [
    {
      "history_id": 101,
      "user_id": "u1",
      "create_time": 1731686400,
      "subject": "Math",
      "tag": "Algebra",
      "progress": 0.83
    }
  ]
}
```

### 2.2 获取单科统计（当前 dashboard 核心来源）

- Method: `GET`
- Path: `/statistics`
- Query:
  - `username: string` (required)
  - `subject: string` (required)
- Header:
  - `AUTHORIZATION: string` (required)

Response (`200`):

```json
{
  "code": 200,
  "info": "ok",
  "data": {
    "latest_time": "2025-02-20T14:20:00Z",
    "start_of_week": "2025-02-17",
    "end_of_week": "2025-02-23",
    "daily_statistics": [
      {
        "date": "2025-02-17",
        "total_attempts": 12,
        "correct_attempts": 9,
        "correct_rate": 0.75,
        "questions_on_date": [101, 102, 103]
      }
    ]
  }
}
```

> 当前前端是对每个 `subject` 调用一次 `/statistics`，再在前端聚合为 dashboard。

---

## 3. 建议新增接口（推荐）

> 目的：1 次请求返回 dashboard 全量数据，降低请求次数并提升稳定性。

### 3.1 获取 dashboard 总览

- Method: `GET`
- Path: `/dashboard/overview`
- Query:
  - `username: string` (required)
  - `subject: string` (optional，默认返回 `all` 并附带聚焦 subject)
  - `week_start: string` (optional, `YYYY-MM-DD`)
  - `tz: string` (optional, e.g. `Asia/Shanghai`, 默认服务器时区)
- Header:
  - `AUTHORIZATION: string` (required)

Response (`200`):

```json
{
  "code": 200,
  "info": "ok",
  "data": {
    "latest_time": "2025-02-20T14:20:00Z",
    "start_of_week": "2025-02-17",
    "end_of_week": "2025-02-23",
    "focus_subject": "Math",
    "summary": {
      "total_attempts": 124,
      "correct_attempts": 91,
      "accuracy_rate": 0.7339,
      "active_days": 5,
      "streak_days": 3,
      "weekly_goal": 120,
      "weekly_goal_progress": 1.0333,
      "subject_rank": 1,
      "active_subject_count": 4
    },
    "daily_overview": [
      {
        "date": "2025-02-17",
        "total_attempts": 30,
        "correct_attempts": 22,
        "incorrect_attempts": 8,
        "accuracy_rate": 0.7333
      }
    ],
    "subject_overview": [
      {
        "subject": "Math",
        "total_attempts": 52,
        "correct_attempts": 41,
        "accuracy_rate": 0.7885
      },
      {
        "subject": "Physics",
        "total_attempts": 33,
        "correct_attempts": 20,
        "accuracy_rate": 0.6061
      }
    ],
    "insights": [
      {
        "id": "peak-day",
        "title": "Peak Study Day",
        "description": "Feb 19 reached 30 attempts.",
        "tone": "positive"
      },
      {
        "id": "weak-day",
        "title": "Most Challenging Day",
        "description": "Feb 18 accuracy dropped to 58.3%.",
        "tone": "warning"
      }
    ]
  }
}
```

字段说明：

- `summary`: KPI 卡片和目标进度数据源
- `daily_overview`: 折线图 + 堆叠柱状图数据源
- `subject_overview`: 环形图 + 学科排名图数据源
- `insights`: 洞察卡片（可由后端策略生成，也可前端 fallback 计算）

---

## 4. 可选扩展（未来可加）

如果你希望再加入“难度分布/答题耗时/题型表现”图表，建议 `data` 增加：

```json
{
  "difficulty_distribution": [
    { "difficulty": 1, "attempts": 12, "accuracy_rate": 0.91 },
    { "difficulty": 2, "attempts": 21, "accuracy_rate": 0.83 },
    { "difficulty": 3, "attempts": 26, "accuracy_rate": 0.69 }
  ],
  "avg_response_time_seconds": 18.4,
  "question_type_performance": [
    { "type": "single", "attempts": 60, "accuracy_rate": 0.78 },
    { "type": "multiple", "attempts": 41, "accuracy_rate": 0.66 }
  ]
}
```

---

## 5. 错误码建议

- `400`: 参数错误（如 `week_start` 格式错误）
- `401`: 未授权或 token 失效
- `404`: 用户不存在或无可用数据
- `500`: 统计聚合失败

统一错误体建议：

```json
{
  "code": 400,
  "info": "invalid week_start format"
}
```

---

## 6. 前端映射关系

- KPI 卡片 <- `summary`
- Accuracy Trend <- `daily_overview[].accuracy_rate`
- Correct vs Incorrect <- `daily_overview[].correct_attempts` + `incorrect_attempts`
- Subject Accuracy Ranking <- `subject_overview[].accuracy_rate`
- Attempt Distribution <- `subject_overview[].total_attempts`
- Smart Insights <- `insights`

---

## 7. 本地 Mock 使用方式

前端已内置 `/dashboard/overview` mock 数据，开发环境默认开启：

- `.env.development`: `VITE_OVERVIEW_USE_MOCK=true`
- `.env.production`: `VITE_OVERVIEW_USE_MOCK=false`

你也可以通过 URL 强制开启：

- `/overview?subject=Math&mock=1`

Mock 响应示例（节选）：

```json
{
  "code": 200,
  "info": "ok",
  "data": {
    "focus_subject": "Math",
    "summary": {
      "total_attempts": 147,
      "correct_attempts": 112,
      "accuracy_rate": 0.7619,
      "weekly_goal": 120
    },
    "daily_overview": [
      {
        "date": "2026-02-16",
        "total_attempts": 18,
        "correct_attempts": 12,
        "incorrect_attempts": 6,
        "accuracy_rate": 0.67
      }
    ],
    "subject_overview": [
      {
        "subject": "Math",
        "total_attempts": 147,
        "correct_attempts": 112,
        "accuracy_rate": 0.7619
      }
    ],
    "insights": [
      {
        "id": "peak-day",
        "title": "Peak Study Day",
        "description": "2026-02-19 完成 27 次练习，学习强度很高。",
        "tone": "positive"
      }
    ]
  }
}
```
