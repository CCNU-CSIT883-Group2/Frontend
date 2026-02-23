# Profile Trend API 文档

## 1. 目标

为 Profile 页左侧 `Trend` 图表提供单一数据源，避免页面为趋势图额外拼装多次请求。

前端已改为仅调用该接口；若接口异常或返回空数据，将展示本地兜底空趋势数据（最近 7 天 0 值）。

## 2. 接口定义

### 2.1 获取 Profile 趋势数据

- Method: `GET`
- Path: `/profile/trend`
- Query:
  - `username: string` (required)
  - `days: number` (optional, default `7`, recommended range `7~30`)
  - `tz: string` (optional, e.g. `Asia/Shanghai`)
- Header:
  - `AUTHORIZATION: string` (required)

Response (`200`):

```json
{
  "code": 200,
  "info": "ok",
  "data": {
    "latest_time": "2026-02-22T18:20:00Z",
    "start_date": "2026-02-16",
    "end_date": "2026-02-22",
    "daily_trend": [
      {
        "date": "2026-02-16",
        "total_attempts": 12,
        "correct_attempts": 8,
        "incorrect_attempts": 4
      },
      {
        "date": "2026-02-17",
        "total_attempts": 9,
        "correct_attempts": 6,
        "incorrect_attempts": 3
      }
    ]
  }
}
```

## 3. 字段说明

- `latest_time`: 本次统计最后更新时间（ISO 时间）
- `start_date`: 查询区间起始日期（`YYYY-MM-DD`）
- `end_date`: 查询区间结束日期（`YYYY-MM-DD`）
- `daily_trend`: 每日趋势数据
  - `date`: 日期（`YYYY-MM-DD`）
  - `total_attempts`: 当日总作答次数
  - `correct_attempts`: 当日正确次数
  - `incorrect_attempts`: 当日错误次数（可选，若提供则应满足 `total_attempts = correct_attempts + incorrect_attempts`）

## 4. 前端映射

Profile `Trend` 图表使用堆叠柱状图：

- Green (`Correct`) <- `daily_trend[].correct_attempts`
- Orange (`Incorrect`) <- `daily_trend[].incorrect_attempts` 或 `total_attempts - correct_attempts`
- X 轴 <- `daily_trend[].date`（展示为 `M/D`）
- Y 轴 <- Attempts

## 5. 错误码建议

- `400`: 参数错误（如 `days` 非法）
- `401`: 未授权或 token 失效
- `404`: 用户不存在
- `500`: 趋势聚合失败

统一错误响应建议：

```json
{
  "code": 400,
  "info": "invalid days"
}
```
