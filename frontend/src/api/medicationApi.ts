import { request, unwrap } from '../utils/request';
import type {
  CreateMedicationPayload,
  MedicationCreateResult,
  MedicationProgress,
  MedicationSchedule,
} from '../types/medication';
import { buildMockProgress, mockMedications } from '../utils/mockData';

export const medicationApi = {
  list: (params?: { petId?: string }) =>
    unwrap<MedicationSchedule[]>(request.get('/medications', { params }), mockMedications),
  progress: (params: { petId: string; date?: string }) =>
    unwrap<MedicationProgress>(request.get('/medications/progress', { params }), buildMockProgress(params.petId)),
  create: (payload: CreateMedicationPayload) =>
    request
      .post('/medications', payload)
      .then((res) => res.data.data as MedicationCreateResult),
  update: (id: string, payload: CreateMedicationPayload) =>
    request
      .patch(`/medications/${id}`, payload)
      .then((res) => res.data.data as MedicationSchedule),
  confirmDose: (id: string, payload: { doseOrder: number; doseDate?: string }) =>
    request
      .post(`/medications/${id}/confirm`, payload)
      .then((res) => res.data.data),
};
