import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingCard } from '../../../../components/loading/LoadingCard';
import { useGetLiquidReportQuery } from '../../../../graphql/queries/__generated__/getChannelReport.generated';
import { useChartColors } from '../../../../lib/chart-colors';
import { HorizontalBarChart } from '../../../../components/chart/HorizontalBarChart';
import { t } from '@/i18n';

export const LiquidityGraph = () => {
  const chartColors = useChartColors();
  const { data, loading } = useGetLiquidReportQuery({ errorPolicy: 'ignore' });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('home.liquidityReport.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-60 w-full items-center justify-center">
            <LoadingCard noCard={true} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.getChannelReport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('home.liquidityReport.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-60 w-full items-center justify-center text-sm text-muted-foreground">
            {t('home.liquidityReport.error')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    local,
    remote,
    maxIn,
    maxOut,
    commit,
    outgoingPendingHtlc,
    incomingPendingHtlc,
    totalPendingHtlc,
  } = data.getChannelReport;

  const liquidity = [
    { label: t('home.liquidityReport.remoteBalance'), Value: remote },
    { label: t('home.liquidityReport.localBalance'), Value: local },
    { label: t('home.liquidityReport.maxIncoming'), Value: maxIn },
    { label: t('home.liquidityReport.maxOutgoing'), Value: maxOut },
    { label: t('home.liquidityReport.totalCommit'), Value: commit },
  ];

  const htlc = [
    { label: t('home.liquidityReport.outgoing'), Value: outgoingPendingHtlc },
    { label: t('home.liquidityReport.incoming'), Value: incomingPendingHtlc },
    { label: t('common.total'), Value: totalPendingHtlc },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('home.liquidityReport.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full">
            <HorizontalBarChart
              dataKey="Value"
              data={liquidity}
              colorRange={[chartColors.green]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('home.liquidityReport.pendingHtlcs')}</CardTitle>
        </CardHeader>
        <CardContent>
          {(totalPendingHtlc || 0) >= 300 && (
            <div className="mb-3 flex items-center gap-2 rounded border border-orange-500/30 bg-orange-500/5 p-2 text-xs text-orange-500">
              <AlertTriangle size={14} className="shrink-0" />
              {t('home.liquidityReport.highHtlcs')}
            </div>
          )}
          {!totalPendingHtlc ? (
            <div className="text-sm text-muted-foreground">
              {t('home.liquidityReport.noHtlcs')}
            </div>
          ) : (
            <div className="w-full" style={{ height: htlc.length * 48 }}>
              <HorizontalBarChart
                dataKey="Value"
                data={htlc}
                colorRange={[chartColors.green]}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
