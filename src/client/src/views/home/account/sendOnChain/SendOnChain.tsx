import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { usePayAddressMutation } from '../../../../graphql/mutations/__generated__/sendToAddress.generated';
import { Input } from '@/components/ui/input';
import { useBitcoinFees } from '../../../../hooks/UseBitcoinFees';
import { getErrorContent } from '../../../../utils/error';
import { Price, getPrice } from '../../../../components/price/Price';
import { useConfigState } from '../../../../context/ConfigContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { usePriceState } from '../../../../context/PriceContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/i18n';

export const SendOnChainCard = ({ setOpen }: { setOpen: () => void }) => {
  const { t } = useTranslation();
  const { fast, halfHour, hour, minimum, dontShow } = useBitcoinFees();
  const { currency, displayValues, fetchFees } = useConfigState();
  const priceContext = usePriceState();
  const format = getPrice(currency, displayValues, priceContext);

  const [confirming, setConfirming] = useState(false);

  const [address, setAddress] = useState('');
  const [tokens, setTokens] = useState(0);
  const [type, setType] = useState(dontShow || !fetchFees ? 'fee' : 'none');
  const [amount, setAmount] = useState(0);
  const [sendAll, setSendAll] = useState(false);
  const [customFee, setCustomFee] = useState(false);

  const canSend = address !== '' && (sendAll || tokens > 0) && amount > 0;

  const [payAddress, { loading }] = usePayAddressMutation({
    onError: error => toast.error(getErrorContent(error)),
    onCompleted: () => {
      toast.success(t('wallet.sendOnChain.paymentSent'));
      setOpen();
    },
    refetchQueries: ['GetNodeInfo', 'GetBalances'],
  });

  useEffect(() => {
    if (type === 'none' && amount === 0) {
      setAmount(fast);
    }
  }, [type, amount, fast]);

  const feeEstimate = () => {
    if (type === 'target') {
      return <>(~{t('wallet.sendOnChain.blocksCount', { count: amount })})</>;
    }
    return <>(~{format({ amount: amount * 223 })})</>;
  };

  const typeAmount = () => {
    switch (type) {
      case 'none':
      case 'fee':
        return { fee: amount };
      case 'target':
        return { target: amount };
      default:
        return {};
    }
  };

  const tokenAmount = sendAll ? { sendAll } : { tokens };

  // Deduplicate fee speeds
  const feeSpeeds = [
    { label: t('wallet.fees.fastest'), value: fast },
    ...(halfHour !== fast
      ? [{ label: t('wallet.fees.halfHour'), value: halfHour }]
      : []),
    ...(hour !== halfHour
      ? [{ label: t('wallet.fees.hour'), value: hour }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Address */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t('wallet.sendOnChain.address')}
        </label>
        <Input
          value={address}
          placeholder="bc1..."
          onChange={e => setAddress(e.target.value)}
        />
      </div>

      <Separator />

      {/* Send All toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t('wallet.sendOnChain.sendAll')}
        </span>
        <Switch checked={sendAll} onCheckedChange={setSendAll} />
      </div>

      {/* Amount */}
      {!sendAll && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t('wallet.sendOnChain.amount')}{' '}
            <span className="text-foreground">
              <Price amount={tokens} />
            </span>
          </label>
          <Input
            placeholder="sats"
            type="number"
            value={tokens && tokens > 0 ? tokens : ''}
            onChange={e => setTokens(Number(e.target.value))}
          />
        </div>
      )}

      <Separator />

      {/* Fee type */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t('wallet.sendOnChain.feeType')}
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={type}
          onValueChange={v => {
            if (!v) return;
            setType(v);
            setCustomFee(false);
            if (v === 'none') setAmount(fast);
            else setAmount(0);
          }}
        >
          {fetchFees && !dontShow && (
            <ToggleGroupItem value="none">
              {t('wallet.fees.auto')}
            </ToggleGroupItem>
          )}
          <ToggleGroupItem value="fee">
            {t('wallet.sendOnChain.fee')}
          </ToggleGroupItem>
          <ToggleGroupItem value="target">
            {t('wallet.sendOnChain.target')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Fee amount */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t('wallet.sendOnChain.feeAmount')}{' '}
            <span className="text-foreground/60">{feeEstimate()}</span>
            {!dontShow && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {t('wallet.fees.minimum', { minimum })}
              </Badge>
            )}
          </span>
        </div>

        {type === 'none' ? (
          <>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              className="w-full"
              value={customFee ? 'custom' : String(amount)}
              onValueChange={v => {
                if (!v) return;
                if (v === 'custom') {
                  setCustomFee(true);
                  setAmount(0);
                } else {
                  setCustomFee(false);
                  setAmount(Number(v));
                }
              }}
            >
              {feeSpeeds.map(s => (
                <ToggleGroupItem
                  key={s.value}
                  value={String(s.value)}
                  className="flex-1"
                >
                  {s.label} ({s.value})
                </ToggleGroupItem>
              ))}
              <ToggleGroupItem value="custom" className="flex-1">
                {t('wallet.fees.custom')}
              </ToggleGroupItem>
            </ToggleGroup>
            {customFee && (
              <Input
                value={amount && amount > 0 ? amount : ''}
                placeholder="sats/vB"
                type="number"
                onChange={e => setAmount(Number(e.target.value))}
              />
            )}
          </>
        ) : (
          <Input
            value={amount && amount > 0 ? amount : ''}
            placeholder={
              type === 'target' ? t('wallet.sendOnChain.blocks') : 'sats/vB'
            }
            type="number"
            onChange={e => setAmount(Number(e.target.value))}
          />
        )}
      </div>

      {/* Send / Confirm */}
      {!confirming ? (
        <Button
          variant="outline"
          disabled={!canSend || loading}
          className="w-full"
          onClick={() => setConfirming(true)}
        >
          {t('wallet.sendOnChain.send')}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="divide-y divide-border rounded border border-border text-xs">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-muted-foreground">
                {t('wallet.sendOnChain.amount')}
              </span>
              <span className="font-medium">
                {sendAll ? (
                  t('wallet.sendOnChain.all')
                ) : (
                  <Price amount={tokens} />
                )}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-muted-foreground">
                {t('wallet.sendOnChain.address')}
              </span>
              <span className="max-w-50 truncate font-mono text-[11px] font-medium">
                {address}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-muted-foreground">
                {t('wallet.sendOnChain.fee')}
              </span>
              <span className="font-medium">
                {type === 'target'
                  ? t('wallet.sendOnChain.blocksCount', { count: amount })
                  : `${amount} sats/vB`}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirming(false)}
            >
              {t('wallet.sendOnChain.cancel')}
            </Button>
            <Button
              className="flex-1"
              disabled={!canSend || loading}
              onClick={() =>
                payAddress({
                  variables: { address, ...typeAmount(), ...tokenAmount },
                })
              }
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                t('wallet.sendOnChain.confirmSend')
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
