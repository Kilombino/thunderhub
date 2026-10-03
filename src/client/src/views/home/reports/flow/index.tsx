import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TransactionsGraph } from './TransactionGraph';
import { t } from '@/i18n';

export interface PeriodProps {
  period: number;
  amount: number;
  tokens: number;
}

export const FlowBox = ({
  show: controlledShow,
  type: controlledType,
}: {
  show?: string;
  type?: string;
} = {}) => {
  const [localShow, setLocalShow] = useState('invoices');
  const [localType, setLocalType] = useState('count');

  const show = controlledShow ?? localShow;
  const type = controlledType ?? localType;
  const isControlled = controlledShow !== undefined;

  return (
    <Card>
      {!isControlled && (
        <div className="flex gap-1.5 px-5 pt-5">
          <ToggleGroup
            type="single"
            value={show}
            onValueChange={v => v && setLocalShow(v)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="invoices" className="text-xs px-2">
              {t('home.flow.invoices')}
            </ToggleGroupItem>
            <ToggleGroupItem value="payments" className="text-xs px-2">
              {t('home.flow.payments')}
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={type}
            onValueChange={v => v && setLocalType(v)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="count" className="text-xs px-2">
              {t('home.flow.count')}
            </ToggleGroupItem>
            <ToggleGroupItem value="tokens" className="text-xs px-2">
              {t('home.flow.volume')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      <CardContent>
        <TransactionsGraph showPay={show === 'payments'} type={type} />
      </CardContent>
    </Card>
  );
};
