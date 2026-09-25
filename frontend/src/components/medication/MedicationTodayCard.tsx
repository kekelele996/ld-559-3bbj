import { Button, Card, Progress, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { useConfirmDose } from '../../hooks/useMedications';
import type { MedicationProgress } from '../../types/medication';

interface Props {
  progress?: MedicationProgress;
  loading?: boolean;
}

export function MedicationTodayCard({ progress, loading }: Props) {
  const confirm = useConfirmDose();
  const percent = progress && progress.totalDoses > 0
    ? Math.round((progress.confirmedDoses / progress.totalDoses) * 100)
    : 0;

  return (
    <Card
      title={`今日用药 · ${progress?.date || ''}`}
      extra={
        <Space>
          <Typography.Text strong>{progress?.confirmedDoses ?? 0}/{progress?.totalDoses ?? 0} 次</Typography.Text>
          <Tag color={percent === 100 ? 'green' : 'orange'}>{percent === 100 ? '今日已完成' : '进行中'}</Tag>
        </Space>
      }
      loading={loading}
    >
      <Progress percent={percent} size="small" status={percent === 100 ? 'success' : 'active'} />
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {(progress?.items || []).length === 0 && (
          <Typography.Text type="secondary">今天没有需要执行的用药安排。</Typography.Text>
        )}
        {progress?.items.map((item) => (
          <Card key={item.scheduleId} size="small" type="inner"
            title={
              <Space wrap>
                <Typography.Text strong>{item.drugName}</Typography.Text>
                <Typography.Text type="secondary">
                  {item.dosePerKg}mg/kg × {item.petWeight}kg
                </Typography.Text>
              </Space>
            }
            extra={<Typography.Text type="secondary">每次 {item.dosePerDose}mg · 每日 {item.dailyTotal}mg</Typography.Text>}
          >
            <Space wrap>
              {item.doses.map((dose) => (
                <Button
                  key={dose.doseOrder}
                  size="small"
                  type={dose.confirmed ? 'default' : 'primary'}
                  ghost={dose.confirmed}
                  disabled={dose.confirmed}
                  icon={dose.confirmed ? <CheckCircleFilled style={{ color: '#52c41a' }} /> : undefined}
                  loading={confirm.isPending}
                  onClick={() => confirm.mutate({ scheduleId: item.scheduleId, doseOrder: dose.doseOrder, doseDate: progress.date })}
                >
                  第 {dose.doseOrder} 次{dose.confirmed ? ' · 已喂' : ' · 确认'}
                </Button>
              ))}
            </Space>
          </Card>
        ))}
      </Space>
    </Card>
  );
}
