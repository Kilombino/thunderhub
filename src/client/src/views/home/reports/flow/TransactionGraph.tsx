import { FC, useMemo } from 'react';
import { LoadingCard } from '../../../../components/loading/LoadingCard';
import { useChartColors } from '../../../../lib/chart-colors';
import { getByTime } from '../../../../views/dashboard/widgets/helpers';
import { useGetInvoicesQuery } from '../../../../graphql/queries/__generated__/getInvoices.generated';
import { differenceInDays } from 'date-fns';
import { useGetPaymentsQuery } from '../../../../graphql/queries/__generated__/getPayments.generated';
import { BarChart } from '../../../../components/chart/BarChart';
import { t } from '@/i18n';

type TransactionsGraphProps = {
  showPay: boolean;
  type: string;
};

export const TransactionsGraph: FC<TransactionsGraphProps> = ({
  showPay,
  type,
}) => {
  const chartColors = useChartColors();
  const { data: invoiceData, loading } = useGetInvoicesQuery();
  const { data: paymentsData, loading: paymentsLoading } =
    useGetPaymentsQuery();

  const seriesName = showPay
    ? t('home.flow.payments')
    : t('home.flow.invoices');

  const labels = useMemo(() => {
    switch (type) {
      case 'amount':
        return {
          yAxisLabel: t('home.flow.amountOf', { name: seriesName }),
          title: t('home.flow.amountOf', { name: seriesName }),
        };
      case 'tokens':
        return {
          yAxisLabel: t('home.flow.volumeOf', { name: seriesName }),
          title: t('home.flow.volumeOf', { name: seriesName }),
        };
      default:
        return {};
    }
  }, [type, seriesName]);

  const invoicesByDate = useMemo(() => {
    const invoices = invoiceData?.getInvoices.invoices || [];
    const filtered = invoices.filter(i => !!i.is_confirmed);

    if (!filtered.length) {
      return [];
    }

    const lastInvoice = filtered[filtered.length - 1];

    const difference = differenceInDays(
      new Date(),
      new Date(lastInvoice.confirmed_at || '')
    );

    const invoicesByDate = getByTime(filtered, difference);

    return invoicesByDate;
  }, [invoiceData]);

  const paymentsByDate = useMemo(() => {
    const payments = paymentsData?.getPayments.payments || [];
    const filtered = payments.filter(i => !!i.is_confirmed);

    if (!filtered.length) {
      return [];
    }

    const lastPayment = filtered[filtered.length - 1];

    const difference = differenceInDays(
      new Date(),
      new Date(lastPayment.created_at || '')
    );

    const paymentsByDate = getByTime(filtered, difference);

    return paymentsByDate;
  }, [paymentsData]);

  if (loading || paymentsLoading) {
    return (
      <div className="w-full h-75">
        <div className="flex h-full w-full items-center justify-center">
          <LoadingCard noCard={true} />
        </div>
      </div>
    );
  }

  if (
    (!showPay && !invoiceData?.getInvoices.invoices.length) ||
    (showPay && !paymentsData?.getPayments.payments.length)
  ) {
    return (
      <div className="w-full h-75">
        <div className="flex h-full w-full items-center justify-center">
          {showPay ? t('home.flow.noPayments') : t('home.flow.noInvoices')}
        </div>
      </div>
    );
  }

  const finalArray = showPay ? paymentsByDate : invoicesByDate;
  const finalColor = showPay ? [chartColors.darkyellow] : [chartColors.orange2];

  return (
    <div className="w-full h-75">
      <div
        className="w-full px-4 overflow-auto"
        style={{ height: 'calc(100% - 40px)' }}
      >
        <BarChart
          data={finalArray.map(f => {
            return {
              [seriesName]: f?.[type] || 0,
              date: f.date,
            };
          })}
          colorRange={finalColor}
          title={labels.title || ''}
          dataKey={seriesName}
        />
      </div>
    </div>
  );
};
