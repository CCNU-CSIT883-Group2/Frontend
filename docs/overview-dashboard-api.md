# Overview Dashboard API 文档（已上线）

## 1. 目标
`Overview` 页面由两个接口驱动：

- `/dashboard/overview`：返回所有 subjects 的聚合数据（subject 级）。
- `/dashboard/overview/subject`：返回某个 subject 下的 tag 细分数据（tag 级）。

页面展示模块：

- KPI（Accuracy / Attempts / Active Days / Subject Ranking）
- Accuracy Trend（折线图）
- Correct vs Incorrect（堆叠柱状图）
- Subject Accuracy Ranking（横向条形图）
- Attempt Distribution（环形图）
- Insights（洞察列表）

## 2. 主接口

### 2.1 获取 dashboard 总览

- Method: `GET`
- Path: `/dashboard/overview`
- Query:
  - `week_start: string` (optional, `YYYY-MM-DD`)
  - `tz: string` (optional, 例如 `Asia/Shanghai`)
- Header:
  - `AUTHORIZATION: string` (required)

请求示例：

```http
GET /dashboard/overview?week_start=2026-02-23&tz=Asia/Shanghai
AUTHORIZATION: <token>
```

响应示例（`200`）：

```json
{
  "code": 200,
  "info": "ok",
  "data": {
    "latest_time": "2026-02-23T00:10:00Z",
    "start_of_week": "2026-02-23",
    "end_of_week": "2026-03-01",
    "focus_subject": "计算机网络",
    "summary": {
      "total_attempts": 98,
      "correct_attempts": 80,
      "accuracy_rate": 0.8163,
      "active_days": 7,
      "streak_days": 4,
      "weekly_goal": 120,
      "weekly_goal_progress": 0.8167,
      "subject_rank": 1,
      "active_subject_count": 5
    },
    "daily_overview": [
      {
        "date": "2026-02-23",
        "total_attempts": 14,
        "correct_attempts": 11,
        "incorrect_attempts": 3,
        "accuracy_rate": 0.7857
      }
    ],
    "subject_overview": [
      {
        "subject": "计算机网络",
        "total_attempts": 98,
        "correct_attempts": 80,
        "accuracy_rate": 0.8163
      },
      {
        "subject": "操作系统",
        "total_attempts": 73,
        "correct_attempts": 55,
        "accuracy_rate": 0.7534
      }
    ]
  }
}
```

### 2.2 获取指定 subject 细分数据

- Method: `GET`
- Path: `/dashboard/overview/subject`
- Query:
  - `subject: string` (required)
  - `week_start: string` (optional, `YYYY-MM-DD`)
  - `tz: string` (optional)
  - `tag: string` (optional)
- Header:
  - `AUTHORIZATION: string` (required)

请求示例：

```http
GET /dashboard/overview/subject?subject=计算机网络&week_start=2026-02-23&tz=Asia/Shanghai
AUTHORIZATION: <token>
```

响应结构与字段说明见：`docs/overview-subject-tag-api.md`

## 3. 字段映射（/dashboard/overview）

- Subject 下拉选项 <- `subject_overview[].subject`
- 默认选中 subject <- `focus_subject`
- 全局聚合 KPI（可选展示）<- `summary`
- 全局聚合趋势（可选展示）<- `daily_overview`
- Subject 下 tag 细分图表 <- `/dashboard/overview/subject` 返回的 `tag_overview + daily_tag_overview`

## 4. 兼容接口（可选 fallback）

### 4.1 历史记录

- Method: `GET`
- Path: `/history`
- Query: 无
- Header:
  - `AUTHORIZATION: string` (required)

### 4.2 单科周统计

- Method: `GET`
- Path: `/statistics`
- Query:
  - `subject: string` (required)
- Header:
  - `AUTHORIZATION: string` (required)

## 5. 错误码

- `400`: 参数错误（例如 `week_start` 格式非法）
- `401`: 未授权或 token 无效
- `404`: 无可用数据
- `500`: 服务端聚合失败

错误体：

```json
{
  "code": 400,
  "info": "invalid week_start format"
}
```

## 6. 本地 Mock

- 环境变量：`VITE_OVERVIEW_USE_MOCK=true`
- URL 覆盖：`/overview?subject=计算机网络&mock=1`

说明：mock 仅用于前端联调，线上环境应关闭。
