# PetCare+ 宠物医疗与保险管理平台

```bash
cp .env.example .env
docker compose up -d
```

本地开发：

```bash
cd backend && npm install && npm run prisma:generate && npm run start:dev
cd frontend && npm install && npm run dev
```

访问地址：
- 前端：http://localhost:38408
- 后端 API：http://localhost:38506/api/v1
- 健康检查：http://localhost:38506/api/v1/health

PetCare+ 是面向宠物主人、兽医和管理员的一站式宠物健康管理平台，覆盖宠物档案、就诊记录、**用药安排与每日喂药打卡**、疫苗接种计划、保险保单和提醒通知。

## 用药安排（处方落地）

兽医在就诊后把一段文字处方转成结构化用药安排：登记药名、疗程起止、每日次数、每公斤每次剂量，系统按宠物体重自动算出**每次剂量**与**每日总量**。

- 同一就诊记录 + 同一药名重复提交时，**保留已有安排**并向前端返回重复提示，不会产生第二条记录。
- 主人在「宠物详情 → 今日用药」查看当天进度，按次点击确认；同一安排同一天同一次数唯一约束 + upsert，**重复点击不再计次**。
- 兽医调整疗程（次数/剂量/起止）时，**已确认的打卡记录原样保留**。
- 疗程起止与就诊日冲突（早于就诊日或结束早于开始）、或宠物体重无效（≤ 0 / 空）时**拒绝保存**，处方原文与历史打卡都不变化。

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | React 18、TypeScript、Vite、Ant Design 5 |
| 状态 | React Query、Zustand |
| 图表 | ECharts、echarts-for-react |
| 后端 | NestJS、TypeScript、Prisma |
| 数据库 | PostgreSQL |
| 认证 | JWT、角色守卫 |
| 部署 | Docker Compose、Nginx |

## 功能页面

| 页面 | 功能 |
|---|---|
| `/login` | 演示账号登录 |
| `/pets` | 宠物卡片、搜索、物种筛选 |
| `/pets/:id` | 基本信息、就诊时间线、**今日用药打卡**、疫苗日历、保单列表 |
| `/medical` | 就诊记录表格、处方侧栏、**用药安排登记/疗程调整**、费用柱状图 |
| `/vaccines` | 疫苗日历、待接种提醒、状态标记 |
| `/insurance` | 保单卡片、理赔流程、保费/保障分析 |

## 核心实体贯穿链路

| 实体 | 后端链路 | 前端链路 |
|---|---|---|
| Pet | `prisma/schema.prisma` → `prisma.service.ts` → `pet.repository.ts` → `pet.service.ts` → `pet.controller.ts` → `pet.routes.ts` | `petApi.ts` → `usePets.ts` → `PetList.tsx` / `PetDetail.tsx` / `PetAvatar.tsx` |
| MedicalRecord | Prisma → `medical.repository.ts` → `medical.service.ts` → `medical.controller.ts` → `medical.routes.ts` | `medicalApi.ts` → `usePets.ts` → `MedicalManagement.tsx` / `CostBarChart.tsx` |
| MedicationSchedule + MedicationDoseLog | Prisma → `medication.repository.ts` → `medication.service.ts` → `medication.controller.ts` → `medication.routes.ts` | `medicationApi.ts` → `useMedications.ts` → `MedicationSchedulePanel.tsx` / `MedicationTodayCard.tsx` / `MedicationFormModal.tsx` |
| VaccineRecord | Prisma → `vaccine.repository.ts` → `vaccine.service.ts` → `vaccine.controller.ts` → `vaccine.routes.ts` | `vaccineApi.ts` → `usePets.ts` → `VaccineManagement.tsx` / `VaccineCalendar.tsx` |
| InsurancePolicy | Prisma → `insurance.repository.ts` → `insurance.service.ts` → `insurance.controller.ts` → `insurance.routes.ts` | `insuranceApi.ts` → `usePets.ts` → `InsuranceCenter.tsx` / `InsurancePieChart.tsx` |

## 枚举定义与使用位置

| 枚举 | 后端定义与使用 | 前端定义与使用 |
|---|---|---|
| UserRole | `backend/src/constants/enums.ts`、`auth.guard.ts`、`roles.guard.ts`、`auth.service.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`authStore.ts`、`Login.tsx`、`AuthGuard.tsx` |
| PetSpecies | `backend/src/constants/enums.ts`、`pet.dto.ts`、`pet.repository.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`pet.d.ts`、`PetList.tsx`、`PetAvatar.tsx`、`mockData.ts` |
| VisitType | `backend/src/constants/enums.ts`、`medical.dto.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`medical.d.ts`、`MedicalManagement.tsx`、`mockData.ts` |
| VaccineStatus | `backend/src/constants/enums.ts`、`vaccine.dto.ts`、`notification.scheduler.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`vaccine.d.ts`、`VaccineManagement.tsx`、`VaccineCalendar.tsx`、`StatusBadge.tsx` |
| InsuranceStatus | `backend/src/constants/enums.ts`、`insurance.dto.ts`、`notification.scheduler.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`insurance.d.ts`、`InsuranceCenter.tsx`、`InsurancePieChart.tsx`、`StatusBadge.tsx` |
| PolicyType | `backend/src/constants/enums.ts`、`insurance.dto.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`insurance.d.ts`、`InsuranceCenter.tsx`、`mockData.ts` |
| Gender | `backend/src/constants/enums.ts`、`pet.dto.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`pet.d.ts`、`PetDetail.tsx`、`mockData.ts` |

## RBAC

| 角色 | 数据范围 | 主要能力 |
|---|---|---|
| PET_OWNER | 仅自己的宠物和关联数据 | 查看宠物、病历、疫苗、保单 |
| VET | 分配给自己的就诊/疫苗数据 | 创建和维护医疗记录 |
| ADMIN | 全部数据 | 平台管理、审计查看 |

## 全局异常处理

后端 `backend/src/middleware/error-handler.ts` 统一捕获业务异常和系统异常，返回 `{ code, message, data }`。前端 `frontend/src/utils/request.ts` 统一处理 HTTP 错误和业务错误，使用 Ant Design `message.error()` 提示，401 自动跳转登录页。

## 操作日志

后端 `backend/src/middleware/audit-log.ts` 提供 `@AuditLog('描述')` 装饰器和拦截器，记录创建就诊记录、疫苗接种、投保、理赔、添加宠物等写操作，字段包括请求路径、方法、操作人、请求体摘要、状态码和时间。

## 提醒通知

`backend/src/modules/notifications/notification.scheduler.ts` 使用 Nest Schedule 扫描疫苗到期、保险续保和复诊提醒。前端 `NotificationBell.tsx` 拉取未读通知。

## 目录结构

```text
frontend/
├── src/api/
├── src/components/common/
├── src/components/charts/
├── src/components/medication/   # 用药安排登记表单 / 今日打卡卡 / 安排列表面板
├── src/constants/
├── src/hooks/
├── src/pages/
├── src/stores/
├── src/types/
├── src/utils/
├── src/guards/
├── App.tsx
└── main.tsx

backend/
├── src/modules/pets/
├── src/modules/medical/
├── src/modules/medications/      # controller/service/repository/routes/validator/dto
├── src/modules/vaccines/
├── src/modules/insurance/
├── src/modules/auth/
├── src/modules/notifications/
├── src/prisma/prisma.service.ts
├── src/constants/enums.ts
├── src/middleware/
├── src/exceptions/
├── src/main.ts
└── src/app.module.ts

database/
└── seed.ts
```

## 用药安排 API（`/api/v1/medications`）

| 方法 & 路径 | 说明 |
|---|---|
| `GET /medications?petId=` | 查询用药安排（含打卡记录、宠物、就诊） |
| `GET /medications/progress?petId=&date=` | 查询某日（默认今天）每剂完成情况、每次/每日剂量 |
| `POST /medications` | 兽医登记用药安排；重复（同就诊+同药名）返回 `data.duplicated=true` 且保留原安排 |
| `PATCH /medications/:id` | 兽医调整疗程；不删除任何已确认打卡 |
| `POST /medications/:id/confirm` | 主人按次确认；body `{ doseOrder, doseDate? }`，重复确认幂等不计次 |

```bash
# 登记用药安排（剂量按宠物体重计算）
curl -X POST http://localhost:38506/api/v1/medications \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"petId":"<petId>","recordId":"<recordId>","drugName":"阿莫西林克拉维酸钾","startDate":"2026-09-25","endDate":"2026-10-02","timesPerDay":2,"dosePerKg":12.5}'

# 查看今天喂药进度
curl "http://localhost:38506/api/v1/medications/progress?petId=<petId>" -H "Authorization: Bearer $TOKEN"

# 确认第 1 次喂药（再次调用不会重复计次）
curl -X POST http://localhost:38506/api/v1/medications/<scheduleId>/confirm \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"doseOrder":1}'
```

## 环境变量

| 变量 | 说明 |
|---|---|
| `COMPOSE_PROJECT_NAME` | Docker Compose 名称，默认 `ldpetcare` |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_ROOT_PASSWORD` | 数据库配置 |
| `DATABASE_URL` | Prisma PostgreSQL 连接字符串 |
| `JWT_SECRET` | JWT 密钥 |
| `FRONTEND_PORT` | 默认 `38408` |
| `BACKEND_PORT` | 默认 `38506` |

## Docker

`docker-compose.yml` 顶层声明 `name: ldpetcare`，无 `version:` 字段。前端 Nginx 将 `/api/` 反向代理到 `backend:38506`，并配置 `try_files $uri $uri/ /index.html` 支持 SPA 路由和 WebSocket Upgrade 头。

## License

MIT
