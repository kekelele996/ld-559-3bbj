import { Button, Card, Empty, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useMedicationPlans } from '../../hooks/useMedications';
import { UserRole } from '../../constants/enums';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../utils/format';
import type { MedicationPlan } from '../../types/medication';
import { MedicationPlanForm } from './MedicationPlanForm';
import type { MedicalRecord } from '../../types/medical';

interface Props {
  petId?: string;
  medicalRecordId?: string;
  records?: MedicalRecord[];
}

export function MedicationPlanList({ petId, medicalRecordId, records = [] }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === UserRole.VET || role === UserRole.ADMIN;
  const { data = [], isLoading } = useMedicationPlans(petId || medicalRecordId ? { petId, medicalRecordId } : undefined);
  const [editing, setEditing] = useState<MedicationPlan>();

  return (
    <Card
      title="用药安排"
      extra={<Typography.Text type="secondary">按宠物体重自动核算每次与每日剂量</Typography.Text>}
      loading={isLoading}
    >
      {data.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无用药安排" />
      ) : (
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={data}
          columns={[
            { title: '药品', dataIndex: 'drugName', render: (name: string) => <Typography.Text strong>{name}</Typography.Text> },
            { title: '疗程', render: (_, r) => `${formatDate(r.startDate)} ~ ${formatDate(r.endDate)}` },
            { title: '每日次数', dataIndex: 'timesPerDay', render: (n: number) => `${n} 次` },
            { title: '每次剂量', dataIndex: 'dosePerTime', render: (v: number) => `${v} 单位` },
            { title: '每日总量', dataIndex: 'dailyDose', render: (v: number) => <Tag color="blue">{v} 单位</Tag> },
            {
              title: '已确认打卡',
              render: (_, r) => <Typography.Text type="secondary">{r.logs?.length ?? 0} 次（调整疗程仍保留）</Typography.Text>,
            },
            ...(canEdit
              ? [
                  {
                    title: '操作',
                    render: (_: unknown, r: MedicationPlan) => (
                      <Popconfirm
                        title="调整该疗程？"
                        description="已确认的打卡记录会原样保留。"
                        onConfirm={() => setEditing(r)}
                      >
                        <Button type="link" size="small">调整疗程</Button>
                      </Popconfirm>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}
      <Space style={{ marginTop: 12 }}>
        {editing && (
          <MedicationPlanForm
            open
            plan={editing}
            fixedRecordId={editing.medicalRecordId}
            records={records.length ? records : editing.medicalRecord ? [editing.medicalRecord] : []}
            onClose={() => setEditing(undefined)}
          />
        )}
      </Space>
    </Card>
  );
}
