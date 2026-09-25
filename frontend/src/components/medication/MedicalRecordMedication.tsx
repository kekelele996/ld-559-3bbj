import { Button, Divider, Space, Tag, Typography } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { MedicationPlanForm } from './MedicationPlanForm';
import { MedicationPlanList } from './MedicationPlanList';
import { UserRole } from '../../constants/enums';
import { useAuthStore } from '../../stores/authStore';
import type { MedicalRecord } from '../../types/medical';

/** 就诊处方侧栏：兽医可把一段处方文字转成结构化用药安排。 */
export function MedicalRecordMedication({ record }: { record: MedicalRecord }) {
  const role = useAuthStore((s) => s.user?.role);
  const canCreate = role === UserRole.VET || role === UserRole.ADMIN;
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <Divider orientation="left">用药安排</Divider>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {canCreate && (
          <Button block type="primary" ghost icon={<MedicineBoxOutlined />} onClick={() => setCreating(true)}>
            将处方转为用药安排
          </Button>
        )}
        <Typography.Text type="secondary">
          就诊日 <Tag>{record.visitDate.slice(0, 10)}</Tag>，疗程起止须覆盖该日期；体重为 {record.pet?.weight} kg。
        </Typography.Text>
        <MedicationPlanList medicalRecordId={record.id} records={[record]} />
        {creating && (
          <MedicationPlanForm open fixedRecordId={record.id} records={[record]} onClose={() => setCreating(false)} />
        )}
      </Space>
    </div>
  );
}
