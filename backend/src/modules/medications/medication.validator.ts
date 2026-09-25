import { BusinessException } from '../../exceptions/business.exception';

export function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function toDayKey(value: Date): string {
  return startOfUtcDay(value).toISOString().slice(0, 10);
}

export function validateMedicationCourse(input: { startDate: Date; endDate: Date; visitDate: Date; weight: number }) {
  if (!Number.isFinite(input.weight) || input.weight <= 0) {
    throw new BusinessException('宠物体重无效，无法计算用药剂量');
  }
  const start = startOfUtcDay(input.startDate);
  const end = startOfUtcDay(input.endDate);
  const visit = startOfUtcDay(input.visitDate);
  if (start.getTime() > end.getTime()) {
    throw new BusinessException('疗程开始日期不能晚于结束日期');
  }
  if (start.getTime() < visit.getTime()) {
    throw new BusinessException('疗程开始日期不能早于就诊日期');
  }
  if (end.getTime() < visit.getTime()) {
    throw new BusinessException('疗程结束日期不能早于就诊日期');
  }
  return { start, end, visit };
}
