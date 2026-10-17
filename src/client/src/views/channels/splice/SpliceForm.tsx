import { FC, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ApolloError } from '@apollo/client';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getTransactionLink } from '@/components/generic/helpers';
import { useEstimateSpliceLazyQuery } from '@/graphql/queries/__generated__/estimateSplice.generated';
import { useSpliceChannelMutation } from '@/graphql/mutations/__generated__/spliceChannel.generated';
import { SpliceInput } from '@/graphql/types';
import { getErrorContent } from '@/utils/error';
import { getLocale, t } from '@/i18n';
import {
  canProceed,
  isKnownRefusal,
  parseSats,
  parseWholeRate,
  reasonCode,
} from './splice.helpers';
import {
  formatSats,
  InfoRow,
  reasonText,
  SpliceChannel,
  stateText,
} from './SpliceInfo';

type Direction = 'in' | 'out';
type FeeMode = 'target' | 'rate';
type Step = 'form' | 'confirm' | 'result';

/** A splice error from the server: a known refusal code reads as text. */
const showError = (error: ApolloError) => {
  const message = error.graphQLErrors[0]?.message || error.message;
  if (isKnownRefusal(message)) {
    toast.error(reasonText(message, false));
  } else {
    toast.error(getErrorContent(error));
  }
};

export const SpliceForm: FC<{
  channel: SpliceChannel;
  onDone?: () => void;
}> = ({ channel, onDone }) => {
  const peer =
    channel.peer_alias || channel.partner_public_key.slice(0, 16) || '?';

  const [step, setStep] = useState<Step>('form');
  const [direction, setDirection] = useState<Direction>('in');
  const [amountText, setAmountText] = useState('');
  const [useMax, setUseMax] = useState(false);
  const [address, setAddress] = useState('');
  const [feeMode, setFeeMode] = useState<FeeMode>('target');
  const [targetText, setTargetText] = useState('6');
  const [rateText, setRateText] = useState('');
  const [forceLowFee, setForceLowFee] = useState(false);

  // The input the form describes now, or why it is not valid yet.
  const built = useMemo((): { input?: SpliceInput; error?: string } => {
    const amount = useMax ? null : parseSats(amountText);
    if (!useMax && !amount) return { error: t('splice.form.invalidAmount') };

    const input: SpliceInput = {
      channel_point: channel.channel_point,
      direction,
      use_max: useMax,
      ...(amount ? { amount } : {}),
      ...(direction === 'out' && address.trim()
        ? { address: address.trim() }
        : {}),
    };

    if (feeMode === 'rate') {
      const rate = parseWholeRate(rateText);
      if (rate === null || Number.isNaN(rate) || rate <= 0) {
        return { error: t('splice.form.invalidRate') };
      }
      input.sat_per_vbyte = rate;
      input.force_low_fee = forceLowFee;
    } else {
      const target = parseWholeRate(targetText);
      if (target && !Number.isNaN(target)) input.target_conf = target;
    }

    return { input };
  }, [
    channel.channel_point,
    direction,
    amountText,
    useMax,
    address,
    feeMode,
    targetText,
    rateText,
    forceLowFee,
  ]);

  const inputKey = built.input ? JSON.stringify(built.input) : '';

  const [estimate, { data: estimateData, loading: estimating, variables }] =
    useEstimateSpliceLazyQuery({
      fetchPolicy: 'network-only',
      onError: showError,
    });

  // An estimate only counts for the input it was made for.
  const result =
    estimateData && JSON.stringify(variables?.input) === inputKey
      ? estimateData.estimateSplice
      : null;

  const [splice, { data: spliceData, loading: splicing }] =
    useSpliceChannelMutation({
      refetchQueries: ['GetSpliceStatus', 'GetChannels'],
      onCompleted: () => setStep('result'),
      onError: error => {
        setStep('form');
        showError(error);
      },
    });

  const refusal = result?.refusal_code || null;
  const forced =
    feeMode === 'rate' &&
    forceLowFee &&
    reasonCode(refusal) === 'fee_below_floor';
  const proceed = !!result && canProceed(refusal, forced);
  // A refused estimate keeps meaningless after-splice figures.
  const showFigures = !!result && (!refusal || forced);

  const handleEstimate = () => {
    if (!built.input) {
      if (built.error) toast.error(built.error);
      return;
    }
    estimate({ variables: { input: built.input } });
  };

  const handleConfirm = () => {
    if (!built.input || !proceed) return;
    splice({ variables: { input: built.input } });
  };

  const destination =
    direction === 'out' && address.trim()
      ? address.trim()
      : t('splice.confirm.ownWallet');

  if (step === 'result' && spliceData) {
    const res = spliceData.spliceChannel;
    const aborted = res.state === 'aborted';

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {aborted ? (
            <XCircle size={18} className="text-destructive" />
          ) : res.timed_out ? (
            <Clock size={18} className="text-orange-500" />
          ) : (
            <CheckCircle2 size={18} className="text-green-500" />
          )}
          {aborted ? t('splice.result.aborted') : t('splice.result.started')}
        </div>
        <p className="text-xs text-muted-foreground">
          {aborted
            ? null
            : res.timed_out
              ? t('splice.result.stillRunning', {
                  state: stateText(res.state),
                })
              : t('splice.result.agreed')}
        </p>
        <div className="divide-y divide-border rounded border border-border text-xs">
          <InfoRow label={t('splice.pending.state')}>
            {stateText(res.state)}
          </InfoRow>
          {res.txid && (
            <InfoRow label={t('splice.result.txid')}>
              {getTransactionLink(res.txid)}
            </InfoRow>
          )}
          {res.new_channel_point && (
            <InfoRow label={t('splice.result.newChannelPoint')}>
              {res.new_channel_point}
            </InfoRow>
          )}
          {aborted && (
            <InfoRow label={t('splice.result.reason')}>
              {reasonText(res.reason, res.reason_from_peer)}
            </InfoRow>
          )}
        </div>
        <Button variant="outline" onClick={() => onDone?.()}>
          {t('splice.form.close')}
        </Button>
      </div>
    );
  }

  if (step === 'confirm' && result && built.input) {
    const amount = result.amount.toLocaleString(getLocale());
    const text =
      direction === 'in'
        ? useMax
          ? t('splice.confirm.increaseMax', { peer })
          : t('splice.confirm.increase', { amount, peer })
        : useMax
          ? t('splice.confirm.reduceMax', { peer, address: destination })
          : t('splice.confirm.reduce', { amount, peer, address: destination });

    return (
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium">{t('splice.confirm.title')}</span>
        <p className="text-sm break-all">{text}</p>
        <div className="divide-y divide-border rounded border border-border text-xs">
          <InfoRow label={t('splice.estimate.amount')}>
            {formatSats(result.amount)}
          </InfoRow>
          <InfoRow label={t('splice.estimate.fee')}>
            {t('splice.estimate.feeValue', {
              fee: result.fee.toLocaleString(getLocale()),
              rate: result.sat_per_vbyte,
              vbytes: result.vbytes,
            })}
          </InfoRow>
          <InfoRow label={t('splice.estimate.capacity')}>
            {formatSats(channel.capacity)} → {formatSats(result.new_capacity)}
          </InfoRow>
          <InfoRow label={t('splice.estimate.local')}>
            {formatSats(channel.local_balance)} → {formatSats(result.new_local)}
          </InfoRow>
        </div>
        <div className="flex items-start gap-2 rounded border border-orange-500/40 p-2 text-xs text-orange-600 dark:text-orange-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {t('splice.confirm.warning', { depth: result.lock_depth })}
        </div>
        {forced && (
          <p className="text-xs text-orange-600 dark:text-orange-400">
            {t('splice.estimate.forcedLowFee')}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={splicing}
            onClick={() => setStep('form')}
          >
            {t('splice.form.back')}
          </Button>
          <Button
            className="flex-1"
            disabled={splicing || !proceed}
            onClick={handleConfirm}
          >
            {splicing ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" />
                {t('splice.form.confirming')}
              </>
            ) : (
              t('splice.form.confirm')
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {t('splice.form.direction')}
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={direction}
          onValueChange={value => value && setDirection(value as Direction)}
        >
          <ToggleGroupItem value="in">
            <ArrowDownToLine className="mr-1 size-4" />
            {t('splice.form.increase')}
          </ToggleGroupItem>
          <ToggleGroupItem value="out">
            <ArrowUpFromLine className="mr-1 size-4" />
            {t('splice.form.reduce')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <p className="text-xs text-muted-foreground">
        {direction === 'in'
          ? t('splice.form.increaseHelp')
          : t('splice.form.reduceHelp')}
      </p>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{t('splice.form.amount')}</span>
        <div className="flex gap-2">
          <Input
            inputMode="numeric"
            placeholder={t('splice.form.amountPlaceholder')}
            value={useMax ? '' : amountText}
            disabled={useMax}
            onChange={e => setAmountText(e.target.value)}
          />
          <Button
            variant={useMax ? 'default' : 'outline'}
            onClick={() => setUseMax(!useMax)}
          >
            {t('splice.form.max')}
          </Button>
        </div>
      </div>

      {direction === 'out' && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">
            {t('splice.form.address')}
          </span>
          <Input
            placeholder={t('splice.form.addressPlaceholder')}
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
          {channel.close_address && (
            <p className="text-xs text-orange-600 dark:text-orange-400 break-all">
              {t('splice.form.closeAddress', {
                address: channel.close_address,
              })}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">{t('splice.form.fee')}</span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={feeMode}
            onValueChange={value => value && setFeeMode(value as FeeMode)}
          >
            <ToggleGroupItem value="target">
              {t('splice.form.feeTarget')}
            </ToggleGroupItem>
            <ToggleGroupItem value="rate">
              {t('splice.form.feeRate')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {feeMode === 'target' ? (
          <Input
            inputMode="numeric"
            placeholder={t('splice.form.targetPlaceholder')}
            value={targetText}
            onChange={e => setTargetText(e.target.value)}
          />
        ) : (
          <>
            <Input
              inputMode="numeric"
              placeholder={t('splice.form.ratePlaceholder')}
              value={rateText}
              onChange={e => setRateText(e.target.value)}
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={forceLowFee}
                onCheckedChange={checked => setForceLowFee(checked === true)}
              />
              {t('splice.form.forceLowFee')}
            </label>
          </>
        )}
      </div>

      <Button
        variant="outline"
        disabled={estimating || !built.input}
        onClick={handleEstimate}
      >
        {estimating ? (
          <>
            <Loader2 className="mr-1 size-4 animate-spin" />
            {t('splice.form.estimating')}
          </>
        ) : (
          t('splice.form.estimate')
        )}
      </Button>
      {!built.input && built.error && (amountText || feeMode === 'rate') && (
        <p className="text-xs text-muted-foreground">{built.error}</p>
      )}

      {result && (
        <>
          <Separator />
          <span className="text-xs font-medium">
            {t('splice.estimate.title')}
          </span>
          {refusal && (
            <div
              className={
                forced
                  ? 'flex items-start gap-2 rounded border border-orange-500/40 p-2 text-xs text-orange-600 dark:text-orange-400'
                  : 'flex items-start gap-2 rounded border border-destructive/40 p-2 text-xs text-destructive'
              }
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {forced
                ? t('splice.estimate.forcedLowFee')
                : reasonText(refusal, false)}
            </div>
          )}
          <div className="divide-y divide-border rounded border border-border text-xs">
            <InfoRow label={t('splice.estimate.fee')}>
              {t('splice.estimate.feeValue', {
                fee: result.fee.toLocaleString(getLocale()),
                rate: result.sat_per_vbyte,
                vbytes: result.vbytes,
              })}
            </InfoRow>
            <InfoRow label={t('splice.estimate.amount')}>
              {formatSats(result.amount)}
            </InfoRow>
            {showFigures && (
              <>
                <InfoRow label={t('splice.estimate.capacity')}>
                  {formatSats(channel.capacity)} →{' '}
                  {formatSats(result.new_capacity)}
                </InfoRow>
                <InfoRow label={t('splice.estimate.local')}>
                  {formatSats(channel.local_balance)} →{' '}
                  {formatSats(result.new_local)}
                </InfoRow>
              </>
            )}
            <InfoRow label={t('splice.estimate.lockDepth')}>
              {result.lock_depth}
            </InfoRow>
            <InfoRow label={t('splice.estimate.limits')}>
              {formatSats(result.min)} /{' '}
              {formatSats(direction === 'in' ? result.max_in : result.max_out)}
            </InfoRow>
            <InfoRow label={t('splice.estimate.minRate')}>
              {t('splice.estimate.minRateValue', {
                rate: result.min_sat_per_vbyte,
                source:
                  result.fee_estimate_source === 'relay_minimum'
                    ? t('splice.estimate.sourceRelay')
                    : t('splice.estimate.sourceEstimate'),
              })}
            </InfoRow>
            {direction === 'in' && result.anchor_reserve > 0 && (
              <InfoRow label={t('splice.estimate.anchorReserve')}>
                {formatSats(result.anchor_reserve)}
              </InfoRow>
            )}
            {direction === 'out' && (
              <InfoRow label={t('splice.estimate.destination')}>
                {result.destination_is_ours
                  ? t('splice.estimate.ownWallet')
                  : t('splice.estimate.external')}
              </InfoRow>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {direction === 'out'
              ? t('splice.estimate.feeNoteOut')
              : t('splice.estimate.feeNoteIn')}
          </p>
          <Button disabled={!proceed} onClick={() => setStep('confirm')}>
            {t('splice.form.review')}
          </Button>
        </>
      )}
    </div>
  );
};
