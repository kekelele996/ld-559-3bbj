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

PetCare+ 是面向宠物主人、兽医和管理员的一站式宠物健康管理平台，覆盖宠物档案、就诊记录、疫苗接种计划、保险保单和提醒通知。

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
| `/pets/:id` | 基本信息、就诊时间线、疫苗日历、保单列表、用药安排与今日喂药打卡 |
| `/medical` | 就诊记录表格、处方侧栏、费用柱状图 |
| `/vaccines` | 疫苗日历、待接种提醒、状态标记 |
| `/insurance` | 保单卡片、理赔流程、保费/保障分析 |

## 核心实体贯穿链路

| 实体 | 后端链路 | 前端链路 |
|---|---|---|
| Pet | `prisma/schema.prisma` → `prisma.service.ts` → `pet.repository.ts` → `pet.service.ts` → `pet.controller.ts` → `pet.routes.ts` | `petApi.ts` → `usePets.ts` → `PetList.tsx` / `PetDetail.tsx` / `PetAvatar.tsx` |
| MedicalRecord | Prisma → `medical.repository.ts` → `medical.service.ts` → `medical.controller.ts` → `medical.routes.ts` | `medicalApi.ts` → `usePets.ts` → `MedicalManagement.tsx` / `CostBarChart.tsx` |
| MedicationPlan / MedicationLog | `schema.prisma` → `medication.repository.ts` → `medication.service.ts` → `medication.controller.ts` → `medication.routes.ts` | `medicationApi.ts` → `useMedications.ts` → `PetDetail.tsx` / `MedicationTodayCard.tsx` / `MedicationPlanForm.tsx` |
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

## 用药安排与喂药打卡

处方只有一段文字、多只宠物轮流喂药容易记混，系统把处方接成结构化用药安排（`MedicationPlan`）并按次打卡（`MedicationLog`）。

- 兽医登记药名、疗程起止、每日次数、每公斤每次剂量；系统按宠物当前体重自动算出**每次剂量**（体重 × 每公斤剂量）与**每日总量**（每次剂量 × 每日次数）。
- **同一就诊记录 + 药名重复提交**时不新建数据，保留已有安排并返回 `duplicated: true` 提示，处方和历史打卡都不变。
- 主人在「宠物详情 → 用药安排」查看**今日进度**，逐次确认；同一安排同一天同一次数受唯一约束保护，重复点击不会重复计次。
- 兽医调整疗程（日期/次数/剂量）只更新安排本身并重新核算剂量，**已确认打卡原样保留**。
- 疗程起止未覆盖就诊日、起止倒置，或体重非有限正数（≤0、NaN）时拒绝保存，返回业务错误，原处方与打卡均不变。
- 写操作（登记/调整安排、打卡）走 `@AuditLog` 审计；接口经 `AuthGuard` 鉴权，主人只能看自己宠物、兽医只能操作自己的数据，登记/调整仅兽医可用。

接口示例：

```bash
# 兽医登记用药安排
curl -X POST "$API/medications" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{
  "medicalRecordId": "<就诊记录ID>", "drugName": "益生菌",
  "startDate": "2026-09-25", "endDate": "2026-10-01",
  "timesPerDay": 2, "dosePerKg": 0.1
}'
# 主人查看今日进度
curl "$API/medications/pets/<宠物ID>/today" -H "Authorization: Bearer $TOKEN"
# 确认今天第 1 次服药（doseIndex 从 0 开始，重复提交幂等）
curl -X POST "$API/medications/<安排ID>/confirm" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"doseIndex":0,"date":"2026-09-25"}'
# 兽医调整疗程（历史打卡保留）
curl -X PATCH "$API/medications/<安排ID>" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{
  "drugName": "益生菌", "startDate": "2026-09-25", "endDate": "2027-06-30",
  "timesPerDay": 3, "dosePerKg": 0.2
}'
```

## 目录结构

```text
frontend/
├── src/api/
├── src/components/common/
├── src/components/medication/
├── src/components/charts/
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
├── src/modules/medications/
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
