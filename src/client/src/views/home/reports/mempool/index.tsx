import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBitcoinFees } from '../../../../hooks/UseBitcoinFees';
import { t } from '@/i18n';

export const MempoolReport = () => {
  const { fast, halfHour, hour, minimum, dontShow } = useBitcoinFees();

  if (dontShow) {
    return null;
  }

  const fees = [
    { label: t('home.mempool.fastest'), value: fast },
    { label: t('home.mempool.halfHour'), value: halfHour },
    { label: t('home.mempool.hour'), value: hour },
    { label: t('home.mempool.minimum'), value: minimum },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('home.mempool.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fees.map(fee => (
            <div
              key={fee.label}
              className="flex flex-col items-center gap-0.5 rounded border border-border p-3"
            >
              <span className="text-xs text-muted-foreground">{fee.label}</span>
              <span className="text-sm font-medium font-mono">
                {fee.value} sat/vB
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
