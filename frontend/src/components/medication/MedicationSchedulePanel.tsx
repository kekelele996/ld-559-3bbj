import { Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { medicalApi } from '../../api/medicalApi';
import { usePets } from '../../hooks/usePets';
import { useCreateMedication, useMedications, useUpdateMedication } from '../../hooks/useMedications';
import type { MedicationSchedule } from '../../types/medication';
import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import { MedicationFormModal, type MedicationFormValues } from './MedicationFormModal';

function courseStatus(schedule: MedicationSchedule): { color: string; text: string } {
  const today = dayjs().startOf('day');
  const start = dayjs(schedule.startDate);
  const end = dayjs(schedule.endDate);
  if (today.isBefore(start)) return { color: 'blue', text: '未开始' };
  if (today.isAfter(end)) return { color: 'default', text: '已结束' };
  return { color: 'green', text: '进行中' };
}

export function MedicationSchedulePanel() {
  const { data: schedules = [], isLoading } = useMedications();
  const { data: pets = [] } = usePets();
  const { data: records = [] } = useQuery({ queryKey: ['medical'], queryFn: () => medicalApi.list() });
  const createMedication = useCreateMedication();
  const updateMedication = useUpdateMedication();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MedicationSchedule | null>(null);

  const petName = (petId: string) => pets.find((pet) => pet.id === petId)?.name || '宠物';
  const petWeight = (petId: string) => pets.find((pet) => pet.id === petId)?.weight ?? 0;

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (schedule: MedicationSchedule) => {
    setEditing(schedule);
    setOpen(true);
  };

  const handleSubmit = (values: MedicationFormValues) => {
    const payload = {
      petId: values.petId,
      recordId: values.recordId,
      drugName: values.drugName.trim(),
      startDate: values.range[0].format('YYYY-MM-DD'),
      endDate: values.range[1].format('YYYY-MM-DD'),
      timesPerDay: values.timesPerDay,
      dosePerKg: values.dosePerKg,
    };
    if (editing) {
      updateMedication.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            message.success('疗程已调整，历史打卡记录保留');
            setOpen(false);
          },
        },
      );
      return;
    }
    createMedication.mutate(payload, {
      onSuccess: (result) => {
        if (result?.duplicated) {
          message.warning('该就诊记录下已存在同名用药安排，已保留原有安排');
        } else {
          message.success('用药安排已登记');
        }
        setOpen(false);
      },
    });
  };

  const columns = useMemo(
    () => [
      { title: '宠物', render: (_: unknown, row: MedicationSchedule) => petName(row.petId) },
      { title: '药品', dataIndex: 'drugName' },
      {
        title: '疗程',
        render: (_: unknown, row: MedicationSchedule) => `${formatDate(row.startDate)} ~ ${formatDate(row.endDate)}`,
      },
      { title: '每日次数', dataIndex: 'timesPerDay', render: (value: number) => `${value} 次` },
      { title: '单次剂量', dataIndex: 'dosePerKg', render: (value: number) => `${value} mg/kg` },
      {
        title: '按体重计算',
        render: (_: unknown, row: MedicationSchedule) => {
          const perDose = Math.round(petWeight(row.petId) * row.dosePerKg * 100) / 100;
          return (
            <Space direction="vertical" size={0}>
              <Typography.Text>每次 {perDose} mg</Typography.Text>
              <Typography.Text type="secondary">每日 {Math.round(perDose * row.timesPerDay * 100) / 100} mg</Typography.Text>
            </Space>
          );
        },
      },
      {
        title: '状态',
        render: (_: unknown, row: MedicationSchedule) => {
          const status = courseStatus(row);
          return <Tag color={status.color}>{status.text}</Tag>;
        },
      },
      {
        title: '操作',
        render: (_: unknown, row: MedicationSchedule) => (
          <Button type="link" size="small" onClick={() => openEdit(row)}>调整疗程</Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pets],
  );

  return (
    <Card
      title="用药安排"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>登记用药</Button>}
    >
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={schedules}
        columns={columns}
        pagination={{ pageSize: 8 }}
      />
      <MedicationFormModal
        open={open}
        pets={pets}
        records={records}
        schedule={editing}
        onCancel={() => setOpen(false)}
        onSubmit={handleSubmit}
        submitting={createMedication.isPending || updateMedication.isPending}
      />
    </Card>
  );
}
