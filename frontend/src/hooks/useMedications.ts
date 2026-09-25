import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { medicationApi } from '../api/medicationApi';
import type { ConfirmMedicationPayload, MedicationPlanPayload } from '../types/medication';

export const useMedicationPlans = (params?: { petId?: string; medicalRecordId?: string }) =>
  useQuery({
    queryKey: ['medication-plans', params],
    queryFn: () => medicationApi.list(params),
  });

export const useTodayMedications = (petId?: string) =>
  useQuery({
    queryKey: ['medication-today', petId],
    queryFn: () => medicationApi.today(petId!),
    enabled: Boolean(petId),
  });

export const useCreateMedicationPlan = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: MedicationPlanPayload) => medicationApi.create(payload),
    onSuccess: (res) => {
      if (res.data.duplicated) {
        message.warning(res.data.message || '该就诊记录下已存在同名用药安排，已保留原安排');
      } else {
        message.success('用药安排已登记');
      }
      client.invalidateQueries({ queryKey: ['medication-plans'] });
      client.invalidateQueries({ queryKey: ['medication-today'] });
    },
  });
};

export const useUpdateMedicationPlan = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MedicationPlanPayload }) =>
      medicationApi.update(id, payload),
    onSuccess: () => {
      message.success('疗程已调整，历史打卡保留');
      client.invalidateQueries({ queryKey: ['medication-plans'] });
      client.invalidateQueries({ queryKey: ['medication-today'] });
    },
  });
};

export const useConfirmMedication = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfirmMedicationPayload }) =>
      medicationApi.confirm(id, payload),
    onSuccess: (res) => {
      if (res.data.data?.alreadyConfirmed) {
        message.info('本次服药已确认，无需重复打卡');
      } else {
        message.success('已确认本次服药');
      }
      client.invalidateQueries({ queryKey: ['medication-today'] });
      client.invalidateQueries({ queryKey: ['medication-plans'] });
    },
  });
};
