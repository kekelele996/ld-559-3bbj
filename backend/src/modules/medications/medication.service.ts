import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { dayKey, todayUtc, toUtcDay } from '../../utils/date';
import { CreateMedicationPlanDto, UpdateMedicationPlanDto } from './medication.dto';
import { MedicationRepository } from './medication.repository';
import { computeDoses, validateCourseRange, validatePetWeight } from './medication.validator';

interface AuthUser {
  sub: string;
  role: UserRole;
}

@Injectable()
export class MedicationService {
  constructor(private readonly repo: MedicationRepository) {}

  private ensureVet(user: AuthUser) {
    if (user.role === UserRole.PET_OWNER) {
      throw new BusinessException('仅兽医可以登记或调整用药安排', 40301);
    }
  }

  /** 主人/兽医只能访问与自己有权限的宠物相关的安排。 */
  private async ensurePlanAccessible(planId: string, user: AuthUser) {
    const plan = await this.repo.findById(planId);
    if (!plan) throw new BusinessException('用药安排不存在');
    if (user.role === UserRole.VET && plan.vetId !== user.sub) {
      throw new BusinessException('无权操作该用药安排', 40301);
    }
    if (user.role === UserRole.PET_OWNER && plan.pet.ownerId !== user.sub) {
      throw new BusinessException('无权操作该用药安排', 40301);
    }
    return plan;
  }

  list(user: AuthUser, petId?: string, medicalRecordId?: string) {
    return this.repo.findMany(user, petId, medicalRecordId);
  }

  async create(user: AuthUser, dto: CreateMedicationPlanDto) {
    this.ensureVet(user);
    const drugName = dto.drugName.trim();

    // 同一就诊记录 + 药名重复提交：保留已有安排并提示，原安排与打卡均不变。
    const existing = await this.repo.findByRecordAndDrug(dto.medicalRecordId, drugName);
    if (existing) {
      return { duplicated: true as const, plan: existing };
    }

    return this.buildPlan(dto.medicalRecordId, drugName, dto, user);
  }

  async update(user: AuthUser, id: string, dto: UpdateMedicationPlanDto) {
    this.ensureVet(user);
    const plan = await this.ensurePlanAccessible(id, user);
    const drugName = dto.drugName.trim();

    // 改名时若与同一就诊下的另一安排重名，拒绝并保留现状。
    if (drugName !== plan.drugName) {
      const clash = await this.repo.findByRecordAndDrug(plan.medicalRecordId, drugName);
      if (clash) throw new BusinessException('该就诊记录下已存在同名用药安排');
    }

    // 体重无效或疗程与就诊日冲突时拒绝保存：已有安排与已确认打卡都不变化。
    const weight = validatePetWeight(plan.pet.weight);
    validateCourseRange(dto.startDate, dto.endDate, plan.medicalRecord.visitDate);
    const doses = computeDoses(weight, dto.dosePerKg, dto.timesPerDay);

    const updated = await this.repo.update(id, {
      drugName,
      startDate: toUtcDay(dto.startDate),
      endDate: toUtcDay(dto.endDate),
      timesPerDay: dto.timesPerDay,
      dosePerKg: dto.dosePerKg,
      ...doses,
    });
    // 兽医调整疗程仅更新安排本身，已确认打卡记录原样保留。
    return { duplicated: false as const, plan: updated };
  }

  /** 宠物详情「今日进度」：今天在疗程内的安排 + 今天各次确认状态。 */
  async todayForPet(user: AuthUser, petId: string) {
    const plans = await this.repo.findMany(user, petId);
    const today = todayUtc();
    const key = dayKey(today);
    return plans
      .filter((plan) => key >= dayKey(plan.startDate) && key <= dayKey(plan.endDate))
      .map((plan) => {
        const confirmedIndex = new Set(
          plan.logs.filter((log) => dayKey(log.scheduledDate) === key).map((log) => log.doseIndex),
        );
        const doses = Array.from({ length: plan.timesPerDay }, (_, doseIndex) => ({
          doseIndex,
          confirmed: confirmedIndex.has(doseIndex),
        }));
        return {
          plan,
          doses,
          confirmedCount: confirmedIndex.size,
          totalDoses: plan.timesPerDay,
          completed: confirmedIndex.size >= plan.timesPerDay,
        };
      });
  }

  /** 按次确认：同一安排同一天同一次数只产生一条打卡，重复点击不再重复计次。 */
  async confirm(user: AuthUser, planId: string, dto: { doseIndex: number; date: string }) {
    const plan = await this.ensurePlanAccessible(planId, user);
    const scheduled = toUtcDay(dto.date);
    const key = dayKey(scheduled);

    if (key < dayKey(plan.startDate) || key > dayKey(plan.endDate)) {
      throw new BusinessException('该日期不在疗程范围内');
    }
    if (dto.doseIndex < 0 || dto.doseIndex >= plan.timesPerDay) {
      throw new BusinessException('服药次数超出每日安排');
    }

    const existing = await this.repo.findLog(planId, scheduled, dto.doseIndex);
    if (existing) {
      return { alreadyConfirmed: true as const, log: existing };
    }

    try {
      const log = await this.repo.createLog({
        planId,
        scheduledDate: scheduled,
        doseIndex: dto.doseIndex,
        confirmedById: user.sub,
      });
      const confirmedCount = await this.repo.countLogs(planId, scheduled);
      return { alreadyConfirmed: false as const, log, confirmedCount, totalDoses: plan.timesPerDay };
    } catch (error) {
      // 并发重复确认命中唯一约束时不重复计次，返回已有打卡。
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.repo.findLog(planId, scheduled, dto.doseIndex);
        return { alreadyConfirmed: true as const, log: raced! };
      }
      throw error;
    }
  }

  private async buildPlan(
    medicalRecordId: string,
    drugName: string,
    dto: CreateMedicationPlanDto,
    user: AuthUser,
  ) {
    // 校验关联就诊记录存在，并据此检查宠物体重与疗程是否和就诊日冲突。
    const detail = await this.repo.findMedicalRecord(medicalRecordId);
    if (!detail) throw new BusinessException('就诊记录不存在');
    if (user.role === UserRole.VET && detail.vetId !== user.sub) {
      throw new BusinessException('只能为分配给自己的就诊记录登记用药', 40301);
    }
    const weight = validatePetWeight(detail.pet.weight);
    validateCourseRange(dto.startDate, dto.endDate, detail.visitDate);
    const doses = computeDoses(weight, dto.dosePerKg, dto.timesPerDay);

    try {
      const plan = await this.repo.create({
        medicalRecordId,
        petId: detail.petId,
        vetId: user.sub,
        drugName,
        startDate: toUtcDay(dto.startDate),
        endDate: toUtcDay(dto.endDate),
        timesPerDay: dto.timesPerDay,
        dosePerKg: dto.dosePerKg,
        ...doses,
      });
      return { duplicated: false as const, plan };
    } catch (error) {
      // 并发重复提交同一就诊 + 药名时保留已有安排并提示。
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existed = await this.repo.findByRecordAndDrug(medicalRecordId, drugName);
        if (existed) return { duplicated: true as const, plan: existed };
      }
      throw error;
    }
  }
}
