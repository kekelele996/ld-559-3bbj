import { Form, Input, InputNumber, Modal, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import type { MedicalRecord } from '../../types/medical';
import type { MedicationSchedule } from '../../types/medication';
import type { Pet } from '../../types/pet';
import { formatDate } from '../../utils/format';

export interface MedicationFormValues {
  petId: string;
  recordId: string;
  drugName: string;
  range: [dayjs.Dayjs, dayjs.Dayjs];
  timesPerDay: number;
  dosePerKg: number;
}

interface Props {
  open: boolean;
  pets: Pet[];
  records: MedicalRecord[];
  schedule?: MedicationSchedule | null;
  onCancel: () => void;
  onSubmit: (values: MedicationFormValues) => void;
  submitting?: boolean;
}

export function MedicationFormModal({ open, pets, records, schedule, onCancel, onSubmit, submitting }: Props) {
  const [form] = Form.useForm<MedicationFormValues>();
  const petId = Form.useWatch('petId', form);
  const petRecords = records.filter((record) => !petId || record.petId === petId);

  useEffect(() => {
    if (!open) return;
    if (schedule) {
      form.setFieldsValue({
        petId: schedule.petId,
        recordId: schedule.recordId,
        drugName: schedule.drugName,
        range: [dayjs(schedule.startDate), dayjs(schedule.endDate)],
        timesPerDay: schedule.timesPerDay,
        dosePerKg: schedule.dosePerKg,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ timesPerDay: 2, dosePerKg: 1 });
    }
  }, [open, schedule, form]);

  return (
    <Modal
      title={schedule ? '调整用药疗程' : '登记用药安排'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.validateFields().then(onSubmit)}
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="petId" label="宠物" rules={[{ required: true, message: '请选择宠物' }]}>
          <Select
            placeholder="选择宠物"
            disabled={Boolean(schedule)}
            options={pets.map((pet) => ({ value: pet.id, label: `${pet.name}（${pet.weight}kg）` }))}
          />
        </Form.Item>
        <Form.Item name="recordId" label="就诊记录" rules={[{ required: true, message: '请选择就诊记录' }]}>
          <Select
            placeholder="选择就诊记录"
            disabled={Boolean(schedule)}
            options={petRecords.map((record) => ({
              value: record.id,
              label: `${formatDate(record.visitDate)} · ${record.diagnosis}`,
            }))}
          />
        </Form.Item>
        <Form.Item name="drugName" label="药品名称" rules={[{ required: true, message: '请输入药品名称' }]}>
          <Input placeholder="如：阿莫西林克拉维酸钾" />
        </Form.Item>
        <Form.Item name="range" label="疗程起止" rules={[{ required: true, message: '请选择疗程起止日期' }]}>
          <DatePicker.RangePicker style={{ width: '100%' }} allowClear={false} />
        </Form.Item>
        <Form.Item name="timesPerDay" label="每日次数" rules={[{ required: true, message: '请输入每日次数' }]}>
          <InputNumber min={1} max={20} precision={0} addonAfter="次/天" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="dosePerKg" label="每公斤每次剂量" rules={[{ required: true, message: '请输入每公斤剂量' }]}>
          <InputNumber min={0} step={0.1} addonAfter="mg/kg" style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
