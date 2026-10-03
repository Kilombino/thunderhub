import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Coins, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetUtxosQuery } from '@/graphql/queries/__generated__/getUtxos.generated';
import {
  PrepareCoinControlChannelMutation,
  useCancelCoinControlChannelMutation,
  useConfirmCoinControlChannelMutation,
  usePrepareCoinControlChannelMutation,
} from '@/graphql/mutations/__generated__/coinControlChannel.generated';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Price } from '@/components/price/Price';
import { PeerSelect } from '@/components/select/specific/PeerSelect';
import { shorten } from '@/components/generic/helpers';
import { getErrorContent } from '@/utils/error';
import { useTranslation } from '@/i18n';
import {
  MIN_FEE_RATE,
  maxChannelAmount,
  outpointKey,
  parseFeeRate,
} from './coinControl';

type Proposal = PrepareCoinControlChannelMutation['prepareCoinControlChannel'];

const REFETCH = [
  'GetChannels',
  'GetPendingChannels',
  'GetUtxos',
  'GetChainTransactions',
];

const LowFeeWarning = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-2 rounded border border-orange-500/30 bg-orange-500/5 p-3 text-xs text-muted-foreground">
      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-orange-500" />
      <span>{t('coinControl.lowFeeWarning')}</span>
    </div>
  );
};

const Row = ({ label, children }: { label: string; children: any }) => (
  <div className="flex items-start justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-mono">{children}</span>
  </div>
);

type CoinControlOpenProps = {
  closeCbk: () => void;
};

/**
 * Opens a channel through LND's PSBT flow, funded with exactly the coins the
 * user picks and any fee rate down to 0.1 sat/vB. Nothing is signed until
 * the user approves the reviewed transaction.
 */
export const CoinControlOpen = ({ closeCbk }: CoinControlOpenProps) => {
  const { t } = useTranslation();

  const [isNewPeer, setIsNewPeer] = useState(true);
  const [publicKey, setPublicKey] = useState('');
  const [size, setSize] = useState('');
  const [feeRateInput, setFeeRateInput] = useState('1');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPrivate, setIsPrivate] = useState(false);
  const [routingFeeRate, setRoutingFeeRate] = useState('');
  const [baseFee, setBaseFee] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  // Pending channel id still holding leased coins (cleared once resolved).
  const pendingRef = useRef<string | null>(null);

  const { data, loading: loadingUtxos } = useGetUtxosQuery({
    fetchPolicy: 'network-only',
    onError: error => toast.error(getErrorContent(error)),
  });

  const utxos = useMemo(
    () =>
      [...(data?.getUtxos || [])].sort(
        (a, b) => b.confirmation_count - a.confirmation_count
      ),
    [data]
  );

  const [prepare, { loading: preparing }] =
    usePrepareCoinControlChannelMutation({
      onError: error => toast.error(getErrorContent(error)),
      onCompleted: result => setProposal(result.prepareCoinControlChannel),
    });

  const [cancel, { loading: cancelling }] = useCancelCoinControlChannelMutation(
    {
      onError: error => toast.error(getErrorContent(error)),
      onCompleted: () => {
        pendingRef.current = null;
        setProposal(null);
        toast.success(t('coinControl.review.cancelled'));
      },
      refetchQueries: ['GetUtxos'],
    }
  );

  const [confirm, { loading: confirming }] =
    useConfirmCoinControlChannelMutation({
      onError: error => {
        // The server cancels the pending channel and releases the coins.
        pendingRef.current = null;
        setProposal(null);
        toast.error(getErrorContent(error));
      },
      onCompleted: ({ confirmCoinControlChannel: result }) => {
        pendingRef.current = null;
        setProposal(null);
        toast.success(
          `${t('coinControl.opened', { txid: shorten(result.transaction_id) })} ${t(
            'coinControl.openedDetail',
            { fee: result.fee, rate: result.fee_rate, vsize: result.vsize }
          )}`,
          { duration: 10_000 }
        );
        closeCbk();
      },
      refetchQueries: REFETCH,
    });

  // Release the leased coins if the dialog closes mid-review.
  pendingRef.current = confirming ? null : proposal?.pending_channel_id || null;
  useEffect(
    () => () => {
      if (pendingRef.current) {
        cancel({ variables: { pending_channel_id: pendingRef.current } });
      }
    },
    []
  );

  const feeRate = parseFeeRate(feeRateInput);
  const feeRateValid = feeRate >= MIN_FEE_RATE && feeRate <= 10_000;
  const selectedUtxos = utxos.filter(u => selected.has(outpointKey(u)));
  const selectedTotal = selectedUtxos.reduce((sum, u) => sum + u.tokens, 0);
  const amount = Number(size);
  const maxAmount = maxChannelAmount(selectedUtxos, feeRate);

  const canPrepare =
    !!publicKey &&
    feeRateValid &&
    selectedUtxos.length > 0 &&
    Number.isInteger(amount) &&
    amount > 0 &&
    amount <= maxAmount;

  const toggle = (key: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (proposal) {
    const working = confirming || cancelling;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck size={16} className="text-primary" />
          {t('coinControl.review.title')}
        </div>
        <span className="text-xs text-muted-foreground">
          {t('coinControl.review.expires', {
            time: new Date(proposal.expires_at).toLocaleTimeString(),
          })}
        </span>

        <div className="flex flex-col gap-1 rounded border border-border p-3">
          <span className="text-xs font-medium">
            {t('coinControl.review.inputs')}
          </span>
          {proposal.inputs.map(input => (
            <Row
              key={outpointKey(input)}
              label={`${shorten(input.transaction_id)}:${input.transaction_vout}`}
            >
              <Price amount={input.tokens} />
            </Row>
          ))}
          <Separator className="my-1" />
          <Row label={t('coinControl.review.channel')}>
            <Price amount={proposal.channel_amount} />
          </Row>
          <Row label={t('coinControl.review.change')}>
            {proposal.change > 0 ? (
              <Price amount={proposal.change} />
            ) : (
              t('coinControl.review.noChange')
            )}
          </Row>
          <Row label={t('coinControl.review.fee')}>
            {t('coinControl.review.feeDetail', {
              fee: proposal.fee,
              rate: proposal.estimated_fee_rate,
              vsize: proposal.estimated_vsize,
              requested: proposal.requested_fee_rate,
            })}
          </Row>
          <Separator className="my-1" />
          <Row label={t('coinControl.review.peer')}>
            {shorten(proposal.partner_public_key)}
          </Row>
          <Row label={t('coinControl.review.fundingAddress')}>
            {shorten(proposal.funding_address, 10)}
          </Row>
        </div>

        {proposal.requested_fee_rate < 1 && <LowFeeWarning />}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={working}
            onClick={() =>
              cancel({
                variables: { pending_channel_id: proposal.pending_channel_id },
              })
            }
          >
            {cancelling ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              t('coinControl.review.cancel')
            )}
          </Button>
          <Button
            className="flex-1"
            disabled={working}
            onClick={() =>
              confirm({
                variables: { pending_channel_id: proposal.pending_channel_id },
              })
            }
          >
            {confirming ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              t('coinControl.review.sign')
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{t('coinControl.intro')}</p>

      {/* Peer */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            {t('coinControl.peer')}
          </label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={isNewPeer ? 'new' : 'existing'}
            onValueChange={value => {
              if (value) {
                setIsNewPeer(value === 'new');
                setPublicKey('');
              }
            }}
          >
            <ToggleGroupItem value="new">
              {t('openChannel.newPeer')}
            </ToggleGroupItem>
            <ToggleGroupItem value="existing">
              {t('openChannel.existingPeer')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {isNewPeer ? (
          <Input
            value={publicKey}
            placeholder={t('coinControl.peerPlaceholder')}
            onChange={e => setPublicKey(e.target.value.trim())}
          />
        ) : (
          <PeerSelect callback={peer => setPublicKey(peer[0].public_key)} />
        )}
      </div>

      <Separator />

      {/* UTXOs */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            {t('coinControl.utxos')}
          </label>
          <span className="text-xs text-muted-foreground">
            {t('coinControl.selected', {
              count: selectedUtxos.length,
              total: selectedTotal.toLocaleString(),
            })}
          </span>
        </div>
        {loadingUtxos ? (
          <div className="flex justify-center py-3">
            <Loader2 className="animate-spin" size={16} />
          </div>
        ) : !utxos.length ? (
          <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
            <Coins size={14} />
            {t('coinControl.utxosEmpty')}
          </div>
        ) : (
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded border border-border p-1">
            {utxos.map(utxo => {
              const key = outpointKey(utxo);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.has(key)}
                    onCheckedChange={() => toggle(key)}
                  />
                  <span className="flex-1 truncate font-mono" title={key}>
                    {shorten(utxo.transaction_id, 8)}:{utxo.transaction_vout}
                  </span>
                  <Badge variant="outline">{utxo.address_format}</Badge>
                  {utxo.confirmation_count > 0 ? (
                    <span className="w-16 text-right text-muted-foreground">
                      {t('coinControl.confirmations', {
                        count: utxo.confirmation_count,
                      })}
                    </span>
                  ) : (
                    <Badge variant="secondary" className="w-16 justify-center">
                      {t('coinControl.unconfirmed')}
                    </Badge>
                  )}
                  <span className="w-24 text-right font-mono">
                    <Price amount={utxo.tokens} />
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            {t('coinControl.channelSize')}{' '}
            {amount > 0 && (
              <span className="text-foreground">
                <Price amount={amount} />
              </span>
            )}
          </label>
          <Button
            variant="ghost"
            size="sm"
            disabled={!maxAmount}
            onClick={() => setSize(String(maxAmount))}
          >
            {t('coinControl.useAll')}
          </Button>
        </div>
        <Input
          type="number"
          placeholder={t('openChannel.satsPlaceholder')}
          value={size}
          onChange={e => setSize(e.target.value)}
        />
        {amount > 0 && selectedUtxos.length > 0 && amount > maxAmount && (
          <span className="text-xs text-destructive">
            {t('coinControl.insufficient')}
          </span>
        )}
      </div>

      {/* Fee rate */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t('coinControl.feeRate')}
        </label>
        <Input
          inputMode="decimal"
          value={feeRateInput}
          onChange={e => setFeeRateInput(e.target.value)}
          aria-invalid={!feeRateValid}
        />
        <span className="text-xs text-muted-foreground">
          {t('coinControl.feeRateHint')}
        </span>
      </div>

      {feeRateValid && feeRate < 1 && <LowFeeWarning />}

      <Separator />

      {/* Channel options */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t('openChannel.type')}
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={isPrivate ? 'private' : 'public'}
          onValueChange={value => {
            if (value) setIsPrivate(value === 'private');
          }}
        >
          <ToggleGroupItem value="private">
            {t('openChannel.private')}
          </ToggleGroupItem>
          <ToggleGroupItem value="public">
            {t('openChannel.public')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          {t('coinControl.routingFees')}
        </span>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder={`${t('openChannel.feeRate')} (ppm)`}
            value={routingFeeRate}
            onChange={e => setRoutingFeeRate(e.target.value)}
          />
          <Input
            type="number"
            placeholder={`${t('openChannel.baseFee')} (sats)`}
            value={baseFee}
            onChange={e => setBaseFee(e.target.value)}
          />
        </div>
      </div>

      <Button
        variant="outline"
        className="mt-1 w-full"
        disabled={!canPrepare || preparing}
        onClick={() =>
          prepare({
            variables: {
              input: {
                partner_public_key: publicKey,
                channel_size: amount,
                fee_rate: feeRate,
                outpoints: selectedUtxos.map(u => ({
                  transaction_id: u.transaction_id,
                  transaction_vout: u.transaction_vout,
                })),
                is_private: isPrivate,
                ...(routingFeeRate !== ''
                  ? { routing_fee_rate: Number(routingFeeRate) }
                  : {}),
                ...(baseFee !== ''
                  ? { base_fee_mtokens: String(Number(baseFee) * 1000) }
                  : {}),
              },
            },
          })
        }
      >
        {preparing ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          t('coinControl.prepare')
        )}
      </Button>
    </div>
  );
};
