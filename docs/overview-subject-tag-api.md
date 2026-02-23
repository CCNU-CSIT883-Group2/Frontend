# Overview Subject 细分 API 文档（已上线）

## 1. 目标

当用户在 Overview 选择某个 `subject` 后，图表数据切换为该 subject 下的 `tag` 维度。

该能力由 `/dashboard/overview/subject` 提供。

## 2. 接口定义

### 2.1 获取 Subject 下细分 Dashboard

- Method: `GET`
- Path: `/dashboard/overview/subject`
- Query:
  - `subject: string` (required)
  - `week_start: string` (optional, `YYYY-MM-DD`)
  - `tz: string` (optional, e.g. `Asia/Shanghai`)
  - `tag: string` (optional, 指定后可作为 focus tag)
- Header:
  - `AUTHORIZATION: string` (required)

请求示例：

```http
GET /dashboard/overview/subject?subject=计算机网络&week_start=2026-02-23&tz=Asia/Shanghai
AUTHORIZATION: <token>
```

## 3. 响应结构

Response (`200`):

```json
{
  "code": 200,
  "info": "ok",
  "data": {
    "latest_time": "2026-02-23T00:10:00Z",
    "start_of_week": "2026-02-23",
    "end_of_week": "2026-03-01",
    "focus_subject": "计算机网络",
    "focus_tag": "路由协议",
    "summary": {
      "total_attempts": 98,
      "correct_attempts": 80,
      "accuracy_rate": 0.8163,
      "active_days": 7,
      "streak_days": 4,
      "weekly_goal": 120,
      "weekly_goal_progress": 0.8167,
      "tag_count": 4,
      "tag_rank": 1
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
    "tag_overview": [
      {
        "tag": "路由协议",
        "total_attempts": 36,
        "correct_attempts": 31,
        "incorrect_attempts": 5,
        "accuracy_rate": 0.8611,
        "active_days": 5
      },
      {
        "tag": "拥塞控制",
        "total_attempts": 28,
        "correct_attempts": 21,
        "incorrect_attempts": 7,
        "accuracy_rate": 0.75,
        "active_days": 4
      }
    ],
    "daily_tag_overview": [
      {
        "date": "2026-02-23",
        "tags": [
          {
            "tag": "路由协议",
            "total_attempts": 8,
            "correct_attempts": 7,
            "incorrect_attempts": 1,
            "accuracy_rate": 0.875
          },
          {
            "tag": "拥塞控制",
            "total_attempts": 6,
            "correct_attempts": 4,
            "incorrect_attempts": 2,
            "accuracy_rate": 0.6667
          }
        ]
      }
    ]
  }
}
```

## 4. 字段说明

- `summary`: 当前 `subject` 维度总览（保留周目标相关字段）
- `tag_overview`: tag 排名/分布核心数据
- `daily_tag_overview`: 每日每个 tag 的拆分，用于多序列趋势图/堆叠图
- `focus_tag`: 当前聚焦 tag（后端策略返回，或回传 query tag）
- `insights`: 不由后端返回，前端根据 `tag_overview + daily_tag_overview` 计算生成

## 5. 前端图表映射

- Accuracy Trend
  - 多序列模式：`daily_tag_overview[].tags[].accuracy_rate`
  - 单序列模式（focus tag）：`focus_tag` 对应的每日 `accuracy_rate`
- Correct vs Incorrect
  - `daily_tag_overview[].tags[].correct_attempts/incorrect_attempts`
- Accuracy Ranking（Tag）
  - `tag_overview[].accuracy_rate`
- Attempt Distribution（Tag）
  - `tag_overview[].total_attempts`
- Insights
  - 前端基于 `tag_overview + daily_tag_overview` 计算生成

## 6. 错误码

- `400`: 参数错误（缺失 `subject` 或 `week_start` 格式非法）
- `401`: 未授权或 token 无效
- `404`: subject 无有效数据
- `500`: 聚合失败

错误体：

```json
{
  "code": 400,
  "info": "subject is required"
}
```
