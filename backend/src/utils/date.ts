export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** 归一化为 UTC 0 点，保证「同一天」的判断与时区、时分秒无关。 */
export function toUtcDay(value: string | Date): Date {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** 稳定的天键，如 2026-09-25，用于按天比较与唯一约束。 */
export function dayKey(value: string | Date): string {
  return toUtcDay(value).toISOString().slice(0, 10);
}

/** 当天 UTC 0 点。 */
export function todayUtc(): Date {
  return toUtcDay(new Date());
}
