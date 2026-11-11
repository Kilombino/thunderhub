import { FC, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Price } from '../../../../components/price/Price';
import { useGetLightningAddressInfoLazyQuery } from '../../../../graphql/queries/__generated__/getLightningAddressInfo.generated';
import { LnPay } from '../../quickActions/lnurl/LnPay';
import { getErrorContent } from '../../../../utils/error';
import { t } from '@/i18n';

const ADDRESS = /^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z0-9-]{2,}$/i;

/** "user@domain.tld", optionally with a lightning: prefix. */
export const normalizeLightningAddress = (value: string): string =>
  value
    .trim()
    .replace(/^lightning:/i, '')
    .toLowerCase();

export const isLightningAddress = (value: string | null | undefined): boolean =>
  !!value && ADDRESS.test(normalizeLightningAddress(value));

const metadataText = (metadata?: string | null): string | null => {
  if (!metadata) return null;
  try {
    const entries = JSON.parse(metadata) as [string, string][];
    return entries.find(([type]) => type === 'text/plain')?.[1] || null;
  } catch {
    return null;
  }
};

/**
 * Pay a Lightning Address (LNURL-pay, LUD-16) from the invoice box: look the
 * address up, let the user set the amount (and comment, if the service allows
 * it), then ask the service for an invoice of exactly that amount and pay it.
 */
export const PayAddress: FC<{
  address: string;
  defaultFee?: number;
  payCallback?: () => void;
}> = ({ address, defaultFee = 100, payCallback }) => {
  const clean = useMemo(() => normalizeLightningAddress(address), [address]);
  const [fee, setFee] = useState<number>(defaultFee);

  const [getInfo, { data, loading, error }] =
    useGetLightningAddressInfoLazyQuery({ fetchPolicy: 'network-only' });

  useEffect(() => {
    const timer = setTimeout(
      () => getInfo({ variables: { address: clean } }),
      400
    );
    return () => clearTimeout(timer);
  }, [clean, getInfo]);

  const info = data?.getLightningAddressInfo;
  const description = metadataText(info?.metadata);

  return (
    <div className="flex flex-col gap-3">
      <div className="divide-y divide-border rounded border border-border text-xs">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-muted-foreground">
            {t('wallet.payAddress.address')}
          </span>
          <span className="font-medium break-all">{clean}</span>
        </div>
        {description && (
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-muted-foreground">
              {t('wallet.pay.description')}
            </span>
            <span className="font-medium text-right">{description}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="animate-spin" size={14} />
          {t('wallet.payAddress.looking')}
        </div>
      )}
      {error && !loading && (
        <div className="text-xs text-destructive">
          {t('wallet.payAddress.notFound')} {getErrorContent(error)}
        </div>
      )}

      {info && !loading && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t('wallet.pay.maxFee')}{' '}
              <span className="text-foreground">
                <Price amount={fee} />
              </span>
            </label>
            <Input
              placeholder="sats"
              type="number"
              value={fee && fee > 0 ? fee : ''}
              onChange={e => setFee(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <LnPay
            key={clean}
            request={info}
            hideTitle
            maxFee={fee}
            onPaid={payCallback}
          />
          <div className="text-xs text-muted-foreground">
            {t('wallet.payAddress.note')}
          </div>
        </>
      )}
    </div>
  );
};
