import { AutoComplete, Button, DatePicker, Form, InputNumber, Modal, Select, Space, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo } from 'react';
import { useCreateMedicationPlan, useUpdateMedicationPlan } from '../../hooks/useMedications';
import type { MedicalRecord } from '../../types/medical';
import type { MedicationPlan } from '../../types/medication';

interface FormValues {
  medicalRecordId?: string;
  drugName: string;
  range: [Dayjs, Dayjs];
  timesPerDay: number;
  dosePerKg: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  records: MedicalRecord[];
  /** 固定某条就诊记录（从处方侧栏打开时传入）。 */
  fixedRecordId?: string;
  /** 编辑已有安排时传入。 */
  plan?: MedicationPlan;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function MedicationPlanForm({ open, onClose, records, fixedRecordId, plan }: Props) {
  const [form] = Form.useForm<FormValues>();
  const create = useCreateMedicationPlan();
  const update = useUpdateMedicationPlan();
  const selectedRecordId = Form.useWatch('medicalRecordId', form) as string | undefined;
  const effectiveRecordId = fixedRecordId ?? selectedRecordId;
  const weight =
    records.find((r) => r.id === effectiveRecordId)?.pet?.weight ?? plan?.pet?.weight;

  useEffect(() => {
    if (!open) return;
    if (plan) {
      form.setFieldsValue({
        drugName: plan.drugName,
        range: [dayjs(plan.startDate), dayjs(plan.endDate)],
        timesPerDay: plan.timesPerDay,
        dosePerKg: plan.dosePerKg,
      });
    } else {
      form.resetFields();
      if (fixedRecordId) form.setFieldValue('medicalRecordId', fixedRecordId);
    }
  }, [open, plan, fixedRecordId, form]);

  const values = Form.useWatch([], form) as FormValues | undefined;
  const perTime = useMemo(() => (weight && values?.dosePerKg ? round2(weight * values.dosePerKg) : 0), [weight, values?.dosePerKg]);
  const daily = useMemo(() => round2(perTime * (values?.timesPerDay || 0)), [perTime, values?.timesPerDay]);

  const submit = async () => {
    const v = await form.validateFields();
    const payload = {
      medicalRecordId: fixedRecordId ?? v.medicalRecordId,
      drugName: v.drugName.trim(),
      startDate: v.range[0].format('YYYY-MM-DD'),
      endDate: v.range[1].format('YYYY-MM-DD'),
      timesPerDay: v.timesPerDay,
      dosePerKg: v.dosePerKg,
    };
    if (plan) {
      await update.mutateAsync({ id: plan.id, payload });
    } else {
      const res = await create.mutateAsync(payload);
      if (res.data.duplicated) return; // 已提示，保留弹窗方便查看
    }
    onClose();
  };

  return (
    <Modal
      title={plan ? '调整用药疗程' : '登记用药安排'}
      open={open}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={create.isPending || update.isPending}
      okText={plan ? '保存调整' : '生成安排'}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ timesPerDay: 2, dosePerKg: 0.1 }}>
        {!fixedRecordId && !plan && (
          <Form.Item name="medicalRecordId" label="关联就诊记录" rules={[{ required: true, message: '请选择就诊记录' }]}>
            <Select
              placeholder="选择处方来源就诊"
              options={records.map((r) => ({
                value: r.id,
                label: `${dayjs(r.visitDate).format('YYYY-MM-DD')} · ${r.pet?.name || ''} · ${r.prescription.slice(0, 12)}`,
              }))}
            />
          </Form.Item>
        )}
        <Form.Item name="drugName" label="药品名称" rules={[{ required: true, whitespace: true, message: '请填写药名' }]}>
          <AutoComplete
            placeholder="如：阿莫西林"
            options={['益生菌', '阿莫西林', '美洛昔康', '驱虫药'].map((name) => ({ value: name }))}
            filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>
        <Form.Item
          name="range"
          label="疗程起止（须包含就诊日）"
          rules={[{ required: true, message: '请选择疗程起止日期' }]}
        >
          <DatePicker.RangePicker style={{ width: '100%' }} allowClear={false} />
        </Form.Item>
        <Space size={16} style={{ display: 'flex' }}>
          <Form.Item name="timesPerDay" label="每日次数" style={{ flex: 1 }} rules={[{ required: true }]}>
            <InputNumber min={1} max={10} precision={0} style={{ width: '100%' }} addonAfter="次/日" />
          </Form.Item>
          <Form.Item name="dosePerKg" label="每公斤每次剂量" style={{ flex: 1 }} rules={[{ required: true }]}>
            <InputNumber min={0.0001} step={0.1} style={{ width: '100%' }} addonAfter="单位/kg" />
          </Form.Item>
        </Space>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          当前体重 {weight ?? '-'} kg：每次 <Typography.Text strong>{perTime}</Typography.Text> 单位，每日总量{' '}
          <Typography.Text strong>{daily}</Typography.Text> 单位。重复提交同一就诊与药名将保留原安排。
        </Typography.Paragraph>
      </Form>
    </Modal>
  );
}
