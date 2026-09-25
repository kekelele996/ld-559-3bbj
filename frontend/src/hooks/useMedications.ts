import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { medicationApi } from '../api/medicationApi';
import type { CreateMedicationPayload } from '../types/medication';

export const useMedications = (petId?: string) =>
  useQuery({
    queryKey: ['medications', petId],
    queryFn: () => medicationApi.list({ petId }),
    enabled: Boolean(petId),
  });

export const useMedicationProgress = (petId?: string, date?: string) =>
  useQuery({
    queryKey: ['medication-progress', petId, date],
    queryFn: () => medicationApi.progress({ petId: petId!, date }),
    enabled: Boolean(petId),
  });

export const useCreateMedication = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMedicationPayload) => medicationApi.create(payload),
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['medications'] });
      client.invalidateQueries({ queryKey: ['medication-progress'] });
    },
  });
};

export const useUpdateMedication = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateMedicationPayload }) =>
      medicationApi.update(id, payload),
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['medications'] });
      client.invalidateQueries({ queryKey: ['medication-progress'] });
    },
  });
};

export const useConfirmDose = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, doseOrder, doseDate }: { scheduleId: string; doseOrder: number; doseDate?: string }) =>
      medicationApi.confirmDose(scheduleId, { doseOrder, doseDate }),
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['medication-progress'] });
      client.invalidateQueries({ queryKey: ['medications'] });
    },
  });
};
