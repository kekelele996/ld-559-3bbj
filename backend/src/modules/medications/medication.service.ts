import { Injectable } from '@nestjs/common';
import { UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { ConfirmDoseDto, CreateMedicationDto, UpdateMedicationDto } from './medication.dto';
import { MedicationRepository } from './medication.repository';
import { startOfUtcDay, toDayKey, validateMedicationCourse } from './medication.validator';

@Injectable()
export class MedicationService {
  constructor(private readonly repo: MedicationRepository) {}

  list(user: { sub: string; role: UserRole }, petId?: string) {
    return this.repo.findMany(user, petId);
  }

  async create(dto: CreateMedicationDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const existing = await this.repo.findByRecordAndDrug(dto.recordId, dto.drugName.trim());
    if (existing) {
      // 同一就诊记录和药名重复提交：保留已有安排，不产生新数据
      return { duplicated: true, schedule: existing };
    }
    const context = await this.repo.findContext(dto.recordId, dto.petId);
    if (!context) throw new BusinessException('就诊记录不存在，无法登记用药安排');
    if (context.petId !== dto.petId) throw new BusinessException('就诊记录与宠物不匹配');
    validateMedicationCourse({ startDate, endDate, visitDate: context.visitDate, weight: context.pet.weight });

    try {
      const schedule = await this.repo.create({
        petId: dto.petId,
        recordId: dto.recordId,
        drugName: dto.drugName.trim(),
        startDate: startOfUtcDay(startDate),
        endDate: startOfUtcDay(endDate),
        timesPerDay: dto.timesPerDay,
        dosePerKg: dto.dosePerKg,
      });
      return { duplicated: false, schedule: await this.repo.findById(schedule.id) };
    } catch (error) {
      // 并发重复提交命中唯一索引：同样保留已有安排
      if ((error as { code?: string }).code === 'P2002') {
        const concurrent = await this.repo.findByRecordAndDrug(dto.recordId, dto.drugName.trim());
        if (concurrent) return { duplicated: true, schedule: concurrent };
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateMedicationDto) {
    const schedule = await this.repo.findById(id);
    if (!schedule) throw new BusinessException('用药安排不存在', 40401);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const clash = await this.repo.findByRecordAndDrug(dto.recordId, dto.drugName.trim());
    if (clash && clash.id !== id) throw new BusinessException('该就诊记录下已存在同名用药安排');
    const context = await this.repo.findContext(dto.recordId, dto.petId);
    if (!context) throw new BusinessException('就诊记录不存在，无法调整用药安排');
    if (context.petId !== dto.petId) throw new BusinessException('就诊记录与宠物不匹配');
    validateMedicationCourse({ startDate, endDate, visitDate: context.visitDate, weight: context.pet.weight });

    // 兽医调整疗程只更新安排本身，已确认的打卡记录保留不变
    await this.repo.update(id, {
      petId: dto.petId,
      recordId: dto.recordId,
      drugName: dto.drugName.trim(),
      startDate: startOfUtcDay(startDate),
      endDate: startOfUtcDay(endDate),
      timesPerDay: dto.timesPerDay,
      dosePerKg: dto.dosePerKg,
    });
    return this.repo.findById(id);
  }

  async progress(user: { sub: string; role: UserRole }, petId: string, date?: string) {
    const day = date ? startOfUtcDay(new Date(date)) : startOfUtcDay(new Date());
    const schedules = await this.repo.findMany(user, petId);
    const active = schedules.filter((item) => item.startDate <= day && day <= item.endDate);

    const items = active.map((item) => {
      const logs = item.doseLogs.filter((log) => toDayKey(log.doseDate) === toDayKey(day));
      const weight = item.pet.weight;
      const dosePerDose = round2(weight * item.dosePerKg);
      const dailyTotal = round2(dosePerDose * item.timesPerDay);
      const doses = Array.from({ length: item.timesPerDay }, (_, index) => {
        const doseOrder = index + 1;
        const log = logs.find((entry) => entry.doseOrder === doseOrder);
        return { doseOrder, confirmed: Boolean(log), confirmedAt: log?.confirmedAt ?? null };
      });
      return {
        scheduleId: item.id,
        recordId: item.recordId,
        drugName: item.drugName,
        timesPerDay: item.timesPerDay,
        dosePerKg: item.dosePerKg,
        petWeight: weight,
        dosePerDose,
        dailyTotal,
        doses,
        confirmedCount: doses.filter((dose) => dose.confirmed).length,
        totalCount: item.timesPerDay,
      };
    });

    return {
      date: toDayKey(day),
      items,
      totalDoses: items.reduce((sum, item) => sum + item.totalCount, 0),
      confirmedDoses: items.reduce((sum, item) => sum + item.confirmedCount, 0),
    };
  }

  async confirm(scheduleId: string, dto: ConfirmDoseDto) {
    const schedule = await this.repo.findById(scheduleId);
    if (!schedule) throw new BusinessException('用药安排不存在', 40401);
    if (!Number.isInteger(dto.doseOrder) || dto.doseOrder < 1 || dto.doseOrder > schedule.timesPerDay) {
      throw new BusinessException('打卡次数超出今日用药次数');
    }
    const day = dto.doseDate ? startOfUtcDay(new Date(dto.doseDate)) : startOfUtcDay(new Date());
    if (day < startOfUtcDay(schedule.startDate) || day > startOfUtcDay(schedule.endDate)) {
      throw new BusinessException('该日期不在疗程范围内，无法打卡');
    }
    // 唯一约束 + upsert：同一安排同一天同一次数只确认一次，重复点击不再计次
    await this.repo.upsertDoseLog({ scheduleId, doseDate: day, doseOrder: dto.doseOrder });
    return { scheduleId, doseDate: toDayKey(day), doseOrder: dto.doseOrder };
  }
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
