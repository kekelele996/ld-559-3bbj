import { BusinessException } from '../../exceptions/business.exception';
import { dayKey } from '../../utils/date';

/** 体重必须为有限正数，否则拒绝保存。 */
export function validatePetWeight(weight: number): number {
  if (!Number.isFinite(weight) || weight <= 0) {
    throw new BusinessException('宠物体重无效，无法计算用药剂量');
  }
  return weight;
}

/**
 * 疗程起止必须覆盖就诊日（就诊日落在疗程区间内），否则视为与就诊日冲突。
 * 同时要求开始日不晚于结束日。
 */
export function validateCourseRange(startDate: string, endDate: string, visitDate: string | Date) {
  const start = dayKey(startDate);
  const end = dayKey(endDate);
  const visit = dayKey(visitDate);
  if (start > end) {
    throw new BusinessException('疗程开始日期不能晚于结束日期');
  }
  if (visit < start || visit > end) {
    throw new BusinessException('疗程起止日期与就诊日冲突，就诊日必须包含在疗程内');
  }
}

/** 每次剂量保留两位小数，消除浮点误差；每日总量按次累加保证一致。 */
export function computeDoses(weight: number, dosePerKg: number, timesPerDay: number) {
  const perTime = Math.round(weight * dosePerKg * 100) / 100;
  const daily = Math.round(perTime * timesPerDay * 100) / 100;
  return { dosePerTime: perTime, dailyDose: daily };
}
