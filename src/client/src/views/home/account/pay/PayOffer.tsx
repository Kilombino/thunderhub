import { FC, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Price } from '@/components/price/Price';
import { getErrorContent } from '@/utils/error';
import { useDecodeBolt12Query } from '@/graphql/queries/__generated__/decodeBolt12.generated';
import { usePayOfferMutation } from '@/graphql/mutations/__generated__/payOffer.generated';
import { getLocale, t } from '@/i18n';

const MSAT_PER_SAT = 1000;

/**
 * Whether a pasted string is a BOLT 12 offer (lno1...). Offers may be split
 * with "+" and whitespace, which readers join back.
 */
export const isBolt12Offer = (value: string | null | undefined): boolean =>
  !!value &&
  /^lno1[02-9ac-hj-np-z]+$/i.test(
    value.trim().replace(/\+\s*/g, '').replace(/\s+/g, '')
  );

const Row: FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="font-medium text-right break-all">{children}</span>
  </div>
);

interface PayOfferProps {
  offer: string;
  payCallback?: () => void;
  defaultFee?: number;
  defaultPaths?: number;
}

export const PayOffer: FC<PayOfferProps> = ({
  offer,
  payCallback,
  defaultFee = 100,
  defaultPaths = 16,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [fee, setFee] = useState<number>(defaultFee);
  const [paths, setPaths] = useState<number>(defaultPaths);
  const [confirming, setConfirming] = useState(false);

  const { data, loading: decoding } = useDecodeBolt12Query({
    variables: { bolt12: offer },
    fetchPolicy: 'network-only',
    onError: error =>
      toast.error(
        t('wallet.payOffer.decodeError', { error: getErrorContent(error) })
      ),
  });

  const [payOffer, { loading }] = usePayOfferMutation({
    refetchQueries: ['GetPayments'],
    onCompleted: ({ payOffer: paid }) => {
      toast.success(
        t('wallet.payOffer.paid', {
          amount: Number(paid.amount_msat) / MSAT_PER_SAT,
          fee: Number(paid.fee_msat) / MSAT_PER_SAT,
        })
      );
      setConfirming(false);
      if (payCallback) payCallback();
    },
    onError: error => {
      setConfirming(false);
      toast.error(getErrorContent(error));
    },
  });

  if (decoding) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="animate-spin" size={14} />
        {t('wallet.payOffer.decoding')}
      </div>
    );
  }

  const decoded = data?.decodeBolt12;
  const info = decoded?.offer;

  if (!decoded || !info) return null;

  const problem =
    decoded.type !== 'offer'
      ? t('wallet.payOffer.notAnOffer', { type: decoded.type })
      : !decoded.for_this_chain
        ? t('wallet.payOffer.otherChain')
        : !decoded.valid
          ? t('wallet.payOffer.invalid', {
              error: decoded.validation_error || '',
            })
          : null;

  const offerSats = Math.ceil(Number(info.amount_msat) / MSAT_PER_SAT);
  const needsAmount = offerSats === 0;
  const sellsByQuantity = info.quantity_max > 0 || info.quantity_any;
  const total = needsAmount
    ? amount
    : offerSats * (sellsByQuantity ? quantity : 1);

  const quantityOk =
    !sellsByQuantity ||
    (quantity >= 1 && (!info.quantity_max || quantity <= info.quantity_max));
  const canPay = !problem && total > 0 && quantityOk && !loading;

  const handlePay = () => {
    if (!canPay) return;
    payOffer({
      variables: {
        offer,
        ...(needsAmount ? { tokens: amount } : {}),
        ...(sellsByQuantity ? { quantity } : {}),
        ...(note.trim() ? { payer_note: note.trim() } : {}),
        max_fee: fee,
        max_paths: paths,
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="divide-y divide-border rounded border border-border text-xs">
        <div className="flex items-center justify-between px-3 py-2">
          <Badge variant="secondary" className="rounded-sm text-[10px]">
            {t('wallet.payOffer.offer')}
          </Badge>
          {decoded.ours && (
            <span className="text-muted-foreground">
              {t('wallet.payOffer.ownOffer')}
            </span>
          )}
        </div>
        {info.description && (
          <Row label={t('wallet.payOffer.description')}>{info.description}</Row>
        )}
        {info.issuer && (
          <Row label={t('wallet.payOffer.issuer')}>{info.issuer}</Row>
        )}
        <Row label={t('wallet.payOffer.amount')}>
          {needsAmount ? (
            t('wallet.payOffer.anyAmount')
          ) : (
            <Price amount={offerSats} />
          )}
        </Row>
        {info.absolute_expiry && (
          <Row label={t('wallet.payOffer.expires')}>
            {new Date(info.absolute_expiry).toLocaleString(getLocale())}
          </Row>
        )}
      </div>

      {problem && <div className="text-xs text-destructive">{problem}</div>}

      {!problem && (
        <>
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {needsAmount && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('wallet.payOffer.amountToPay')}
                </label>
                <Input
                  placeholder={t('wallet.payOffer.amountPlaceholder')}
                  type="number"
                  value={amount > 0 ? amount : ''}
                  onChange={e =>
                    setAmount(Math.max(0, Math.floor(Number(e.target.value))))
                  }
                  autoFocus
                />
              </div>
            )}
            {sellsByQuantity && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {info.quantity_max
                    ? t('wallet.payOffer.quantityMax', {
                        max: info.quantity_max,
                      })
                    : t('wallet.payOffer.quantity')}
                </label>
                <Input
                  type="number"
                  value={quantity > 0 ? quantity : ''}
                  onChange={e =>
                    setQuantity(Math.max(0, Math.floor(Number(e.target.value))))
                  }
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t('wallet.payOffer.payerNote')}
              </label>
              <Input
                placeholder={t('wallet.payOffer.payerNotePlaceholder')}
                value={note}
                maxLength={512}
                onChange={e => setNote(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t('wallet.payOffer.maxFee')}{' '}
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t('wallet.payOffer.maxPaths')}
              </label>
              <Input
                type="number"
                value={paths && paths > 0 ? paths : ''}
                onChange={e => setPaths(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground">
            {t('wallet.payOffer.noOutChannels')}
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {t('wallet.payOffer.total')}
              </span>
              <span className="font-medium">
                <Price amount={total} />
              </span>
            </div>
          )}

          <Separator />

          {!confirming ? (
            <Button
              variant="outline"
              disabled={!canPay}
              className="w-full"
              onClick={() => setConfirming(true)}
            >
              {t('wallet.payOffer.pay')}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={loading}
                onClick={() => setConfirming(false)}
              >
                {t('wallet.payOffer.cancel')}
              </Button>
              <Button className="flex-1" disabled={!canPay} onClick={handlePay}>
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  t('wallet.payOffer.confirmPay')
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
