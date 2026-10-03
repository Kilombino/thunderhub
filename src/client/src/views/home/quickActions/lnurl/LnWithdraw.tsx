import { FC, useEffect, useState } from 'react';
import { WithdrawRequest } from '../../../../graphql/types';
import { Title } from '../../../../components/typography/Styled';
import { Separator } from '@/components/ui/separator';
import { renderLine } from '../../../../components/generic/helpers';
import { Input } from '@/components/ui/input';
import { Price } from '../../../../components/price/Price';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useWithdrawLnUrlMutation } from '../../../../graphql/mutations/__generated__/lnUrl.generated';
import { useGetInvoiceStatusChangeLazyQuery } from '../../../../graphql/queries/__generated__/getInvoiceStatusChange.generated';
import { useChartColors } from '../../../../lib/chart-colors';
import { CheckCircle } from 'lucide-react';
import { Link } from '../../../../components/link/Link';
import { getErrorContent } from '../../../../utils/error';
import toast from 'react-hot-toast';
import { Timer } from '../../account/createInvoice/Timer';
import { t } from '@/i18n';

type LnWithdrawProps = {
  request: WithdrawRequest;
};

export const LnWithdraw: FC<LnWithdrawProps> = ({ request }) => {
  const chartColors = useChartColors();
  const { minWithdrawable, maxWithdrawable, callback, defaultDescription, k1 } =
    request;

  const min = Number(minWithdrawable) / 1000 || 0;
  const max = Number(maxWithdrawable) / 1000 || 0;

  const isSame = min === max;

  const [invoiceStatus, setInvoiceStatus] = useState<string>('none');
  const [amount, setAmount] = useState<number>(min);
  const [description, setDescription] = useState<string>(
    defaultDescription || ''
  );

  const [withdraw, { data, loading }] = useWithdrawLnUrlMutation({
    onError: error => toast.error(getErrorContent(error)),
  });
  const [checkStatus, { data: statusData, loading: statusLoading, error }] =
    useGetInvoiceStatusChangeLazyQuery({
      onError: error => toast.error(getErrorContent(error)),
    });

  useEffect(() => {
    if (!loading && data?.lnUrlWithdraw) {
      checkStatus({ variables: { id: data.lnUrlWithdraw } });
    }
  }, [loading, data, checkStatus]);

  useEffect(() => {
    if (statusLoading || !statusData?.getInvoiceStatusChange) return;
    setInvoiceStatus(statusData.getInvoiceStatusChange);
  }, [statusLoading, statusData]);

  if (!callback) {
    return (
      <div className="w-full text-center">{t('home.lnurl.missingInfo')}</div>
    );
  }

  const callbackUrl = new URL(callback);

  const renderContent = () => {
    if (error) {
      return (
        <div className="m-4 flex justify-center items-center">
          <p className="text-sm text-muted-foreground">
            {t('home.lnurl.withdrawStatusError')}{' '}
            <Link to={'/transactions'}>
              {t('wallet.createInvoice.transactions')}
            </Link>
          </p>
        </div>
      );
    }
    if (invoiceStatus === 'paid') {
      return (
        <div className="m-4 flex justify-center items-center">
          <CheckCircle stroke={chartColors.green} size={32} />
          <Title>{t('home.lnurl.paid')}</Title>
        </div>
      );
    }

    if (invoiceStatus === 'not_paid' || invoiceStatus === 'timeout') {
      return (
        <div className="m-4 flex justify-center items-center">
          <Title>
            {t('wallet.createInvoice.checkStatusBefore')}{' '}
            <Link to={'/transactions'}>
              {t('wallet.createInvoice.transactions')}
            </Link>{' '}
            {t('wallet.createInvoice.checkStatusAfter')}
          </Title>
        </div>
      );
    }
    if (statusLoading) {
      return (
        <>
          <Timer initialMinute={1} initialSeconds={30} />
          <div>hello</div>
        </>
      );
    }
    return (
      <>
        {isSame && renderLine(t('home.lnurl.withdrawAmount'), max)}
        {!isSame && renderLine(t('home.lnurl.maxWithdrawAmount'), max)}
        {!isSame && renderLine(t('home.lnurl.minWithdrawAmount'), min)}
        <Separator />
        <div className="flex items-center w-full my-2 flex-col md:flex-row justify-between">
          <div className="flex text-sm whitespace-nowrap flex-wrap md:my-0 my-2">
            <span>{t('wallet.createInvoice.description')}</span>
          </div>
          <Input
            className="ml-0 md:ml-2"
            style={{ maxWidth: '300px' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        {!isSame && (
          <div className="flex items-center w-full my-2 flex-col md:flex-row justify-between">
            <div className="flex text-sm whitespace-nowrap flex-wrap md:my-0 my-2">
              <span>{t('common.amount')}</span>
              <span className="text-muted-foreground mx-2 ml-4">
                <Price amount={amount} />
              </span>
            </div>
            <Input
              className="ml-0 md:ml-2"
              style={{ maxWidth: '300px' }}
              type={'number'}
              value={amount && amount > 0 ? amount : ''}
              onChange={e => setAmount(Number(e.target.value))}
            />
          </div>
        )}
        <Button
          variant="outline"
          disabled={loading || !k1 || statusLoading || !amount}
          className="w-full"
          style={{ margin: '16px 0 0' }}
          onClick={() => {
            if (min && amount < min) {
              toast.error(t('home.lnurl.belowMin'));
            } else if (max && amount > max) {
              toast.error(t('home.lnurl.aboveMax'));
            } else {
              withdraw({
                variables: { callback, amount, k1: k1 || '', description },
              });
            }
          }}
        >
          {loading || statusLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>{t('home.lnurl.withdrawButton', { amount })}</>
          )}
        </Button>
      </>
    );
  };

  return (
    <>
      <Title>{t('home.lnurl.withdraw')}</Title>
      <Separator />
      <div className="w-full text-center">
        {t('home.lnurl.withdrawFrom', { host: callbackUrl.host })}
      </div>
      <Separator />
      {renderContent()}
    </>
  );
};
