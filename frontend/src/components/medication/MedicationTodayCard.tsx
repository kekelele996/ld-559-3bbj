import { Button, Card, Empty, Progress, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useConfirmMedication, useTodayMedications } from '../../hooks/useMedications';

const doseLabel = (index: number) => `第 ${index + 1} 次`;

export function MedicationTodayCard({ petId }: { petId: string }) {
  const { data = [], isLoading } = useTodayMedications(petId);
  const confirm = useConfirmMedication();

  return (
    <Card title="今日用药进度" loading={isLoading} extra={<Typography.Text type="secondary">{dayjs().format('YYYY-MM-DD')}</Typography.Text>}>
      {data.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="今天没有需要服用的药物" />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {data.map(({ plan, doses, confirmedCount, totalDoses, completed }) => (
            <div key={plan.id}>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Space>
                  <Typography.Text strong>{plan.drugName}</Typography.Text>
                  <Tag>每次 {plan.dosePerTime} 单位</Tag>
                  <Tag color="blue">每日 {plan.dailyDose} 单位</Tag>
                </Space>
                {completed ? <Tag icon={<CheckCircleFilled />} color="success">今日已完成</Tag> : null}
              </Space>
              <Progress percent={Math.round((confirmedCount / totalDoses) * 100)} size="small" status={completed ? 'success' : 'active'} />
              <Space wrap>
                {doses.map((dose) =>
                  dose.confirmed ? (
                    <Button key={dose.doseIndex} type="primary" ghost disabled icon={<CheckCircleFilled />}>
                      {doseLabel(dose.doseIndex)} 已喂
                    </Button>
                  ) : (
                    <Button
                      key={dose.doseIndex}
                      type="primary"
                      loading={confirm.isPending}
                      onClick={() =>
                        confirm.mutate({ id: plan.id, payload: { doseIndex: dose.doseIndex, date: dayjs().format('YYYY-MM-DD') } })
                      }
                    >
                      确认{doseLabel(dose.doseIndex)}
                    </Button>
                  ),
                )}
              </Space>
            </div>
          ))}
        </Space>
      )}
    </Card>
  );
}
