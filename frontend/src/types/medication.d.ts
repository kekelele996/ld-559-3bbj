import type { MedicalRecord } from './medical';
import type { Pet } from './pet';

export interface MedicationPlan {
  id: string;
  medicalRecordId: string;
  petId: string;
  vetId: string;
  drugName: string;
  startDate: string;
  endDate: string;
  timesPerDay: number;
  dosePerKg: number;
  dosePerTime: number;
  dailyDose: number;
  pet?: Pet;
  medicalRecord?: MedicalRecord;
  logs?: MedicationLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicationLog {
  id: string;
  planId: string;
  doseIndex: number;
  scheduledDate: string;
  confirmedById?: string;
  confirmedAt: string;
}

export interface MedicationDose {
  doseIndex: number;
  confirmed: boolean;
}

export interface TodayMedication {
  plan: MedicationPlan;
  doses: MedicationDose[];
  confirmedCount: number;
  totalDoses: number;
  completed: boolean;
}

export interface MedicationPlanPayload {
  medicalRecordId?: string;
  drugName: string;
  startDate: string;
  endDate: string;
  timesPerDay: number;
  dosePerKg: number;
}

export interface ConfirmMedicationPayload {
  doseIndex: number;
  date: string;
}
