import { Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { MedicationPlanForm } from './MedicationPlanForm';
import { MedicationPlanList } from './MedicationPlanList';
import { MedicationTodayCard } from './MedicationTodayCard';
import { UserRole } from '../../constants/enums';
import { useAuthStore } from '../../stores/authStore';
import type { MedicalRecord } from '../../types/medical';

interface Props {
  petId: string;
  records: MedicalRecord[];
}

export function PetMedicationPanel({ petId, records }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const canCreate = role === UserRole.VET || role === UserRole.ADMIN;
  const [creating, setCreating] = useState(false);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {canCreate && (
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
            登记用药安排
          </Button>
        </Space>
      )}
      <MedicationTodayCard petId={petId} />
      <MedicationPlanList petId={petId} records={records} />
      {creating && <MedicationPlanForm open records={records} onClose={() => setCreating(false)} />}
    </Space>
  );
}
