import type { Pet } from './pet';

export interface MedicationSchedule {
  id: string;
  petId: string;
  recordId: string;
  drugName: string;
  startDate: string;
  endDate: string;
  timesPerDay: number;
  dosePerKg: number;
  pet?: Pet;
  doseLogs?: MedicationDoseLog[];
}

export interface MedicationDoseLog {
  id: string;
  scheduleId: string;
  doseDate: string;
  doseOrder: number;
  confirmedAt: string;
}

export interface CreateMedicationPayload {
  petId: string;
  recordId: string;
  drugName: string;
  startDate: string;
  endDate: string;
  timesPerDay: number;
  dosePerKg: number;
}

export interface MedicationDose {
  doseOrder: number;
  confirmed: boolean;
  confirmedAt: string | null;
}

export interface TodayMedicationItem {
  scheduleId: string;
  recordId: string;
  drugName: string;
  timesPerDay: number;
  dosePerKg: number;
  petWeight: number;
  dosePerDose: number;
  dailyTotal: number;
  doses: MedicationDose[];
  confirmedCount: number;
  totalCount: number;
}

export interface MedicationProgress {
  date: string;
  items: TodayMedicationItem[];
  totalDoses: number;
  confirmedDoses: number;
}

export interface MedicationCreateResult {
  duplicated: boolean;
  schedule: MedicationSchedule;
}
