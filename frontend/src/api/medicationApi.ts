import { request, unwrap } from '../utils/request';
import type {
  ConfirmMedicationPayload,
  MedicationPlan,
  MedicationPlanPayload,
  TodayMedication,
} from '../types/medication';
import { mockMedicationPlans, mockTodayMedications } from '../utils/mockData';

export const medicationApi = {
  list: (params?: { petId?: string; medicalRecordId?: string }) =>
    unwrap<MedicationPlan[]>(request.get('/medications', { params }), mockMedicationPlans),
  today: (petId: string) =>
    unwrap<TodayMedication[]>(request.get(`/medications/pets/${petId}/today`), mockTodayMedications),
  create: (payload: MedicationPlanPayload) => request.post('/medications', payload),
  update: (id: string, payload: MedicationPlanPayload) => request.patch(`/medications/${id}`, payload),
  confirm: (id: string, payload: ConfirmMedicationPayload) =>
    request.post(`/medications/${id}/confirm`, payload),
};
