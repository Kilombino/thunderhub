import { ReactNode, useState, useEffect } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useOpenChannelMutation } from '../../../graphql/mutations/__generated__/openChannel.generated';
import { Input } from '@/components/ui/input';
import { Price } from '../../../components/price/Price';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useBitcoinFees } from '../../../hooks/UseBitcoinFees';
import { useConfigState } from '../../../context/ConfigContext';
import { PeerSelect } from '../../../components/select/specific/PeerSelect';
import { Separator } from '@/components/ui/separator';
import { getErrorContent } from '../../../utils/error';
import { useTranslation } from '@/i18n';
import { CoinControlOpen } from './CoinControlOpen';

type OpenChannelProps = {
  closeCbk: () => void;
};

export const OpenChannel = ({ closeCbk }: OpenChannelProps) => {
  const { t } = useTranslation();
  // Coin control first: it takes any fee rate down to 0.1 sat/vB and, with no
  // coins ticked, picks them itself. The plain LND open stays as the other option.
  const [mode, setMode] = useState<'auto' | 'coins'>('coins');

  const modeToggle = (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">
        {t('openChannel.funding.label')}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={mode}
        onValueChange={value => {
          if (value) setMode(value as 'auto' | 'coins');
        }}
      >
        <ToggleGroupItem value="auto">
          {t('openChannel.funding.automatic')}
        </ToggleGroupItem>
        <ToggleGroupItem value="coins">
          {t('openChannel.funding.coinControl')}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );

  if (mode === 'coins') {
    return (
      <div className="flex flex-col gap-3">
        {modeToggle}
        <Separator />
        <CoinControlOpen closeCbk={closeCbk} />
      </div>
    );
  }

  return <AutomaticOpenChannel closeCbk={closeCbk} modeToggle={modeToggle} />;
};

const AutomaticOpenChannel = ({
  closeCbk,
  modeToggle,
}: OpenChannelProps & { modeToggle: ReactNode }) => {
  const { t } = useTranslation();
  // XBT fork: Amboss Rails is a peer on the SHA-256 Lightning network; it does not exist
  // on the BLAKE2b chain, so the recommended-peer option is off and hidden.
  const [useRecommended] = useState(false);

  const { fetchFees } = useConfigState();
  const { fast, halfHour, hour, minimum, dontShow } =
    useBitcoinFees(!fetchFees);
  const [size, setSize] = useState(0);

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [pushType, setPushType] = useState('none');
  const [pushTokens, setPushTokens] = useState(0);

  const [isNewPeer, setIsNewPeer] = useState<boolean>(true);
  const [fee, setFee] = useState(0);
  const [publicKey, setPublicKey] = useState('');
  const [privateChannel, setPrivateChannel] = useState(false);
  const [isMaxFunding, setIsMaxFunding] = useState(false);
  const [type, setType] = useState(fetchFees ? 'none' : 'fee');

  const [feeRate, setFeeRate] = useState<number | null>(null);
  const [baseFee, setBaseFee] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  const [openChannel, { loading }] = useOpenChannelMutation({
    onError: error => toast.error(getErrorContent(error)),
    onCompleted: () => {
      toast.success(t('openChannel.opened'));
      closeCbk();
    },
    refetchQueries: ['GetChannels', 'GetPendingChannels'],
  });

  const canOpen =
    (publicKey !== '' || useRecommended) &&
    (size > 0 || isMaxFunding) &&
    fee > 0;

  const pushAmount =
    pushType === 'none'
      ? 0
      : pushType === 'half'
        ? size / 2
        : Math.min(pushTokens, size * 0.9);

  useEffect(() => {
    if (type === 'none' && fee === 0) {
      setFee(fast);
    }
  }, [type, fee, fast]);

  const feeSpeedValue =
    fee === fast
      ? 'fast'
      : fee === halfHour
        ? 'half'
        : fee === hour
          ? 'hour'
          : '';

  const dedupedFees = (() => {
    const seen = new Set<number>();
    const options: { value: string; label: string }[] = [];
    const entries = [
      { value: 'fast', rate: fast, label: t('openChannel.fastest') },
      { value: 'half', rate: halfHour, label: t('openChannel.halfHour') },
      { value: 'hour', rate: hour, label: t('openChannel.hour') },
    ];
    for (const e of entries) {
      if (!seen.has(e.rate)) {
        seen.add(e.rate);
        options.push({ value: e.value, label: `${e.label} (${e.rate})` });
      }
    }
    return options;
  })();

  return (
    <div className="flex flex-col gap-3">
      {modeToggle}
      <Separator />
      {/* Peer */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            {t('openChannel.node')}
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
            placeholder={t('openChannel.peerPlaceholder')}
            onChange={e => setPublicKey(e.target.value)}
          />
        ) : (
          <PeerSelect callback={peer => setPublicKey(peer[0].public_key)} />
        )}
      </div>

      <Separator />

      {/* Channel Size */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t('openChannel.maxSize')}
        </span>
        <Switch
          checked={isMaxFunding}
          onCheckedChange={v => {
            setIsMaxFunding(v);
            if (v) setSize(0);
          }}
        />
      </div>

      {!isMaxFunding && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t('openChannel.channelSize')}{' '}
            <span className="text-foreground">
              <Price amount={size} />
            </span>
          </label>
          <Input
            placeholder={t('openChannel.satsPlaceholder')}
            type="number"
            value={size && size > 0 ? size : ''}
            onChange={e => setSize(Number(e.target.value))}
          />
        </div>
      )}

      <Separator />

      {/* Channel Fees */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t('openChannel.feeRate')}{' '}
            {feeRate != null && (
              <span className="text-foreground">
                <Price amount={feeRate} override="ppm" />
              </span>
            )}
          </label>
          <Input
            placeholder="ppm"
            type="number"
            value={feeRate != null && feeRate > 0 ? feeRate : ''}
            onChange={e => {
              if (e.target.value === '') {
                setFeeRate(null);
              } else {
                setFeeRate(Number(e.target.value));
              }
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t('openChannel.baseFee')}{' '}
            {baseFee != null && (
              <span className="text-foreground">
                <Price amount={baseFee} />
              </span>
            )}
          </label>
          <Input
            placeholder="sats"
            type="number"
            value={baseFee != null && baseFee > 0 ? baseFee : ''}
            onChange={e => {
              if (e.target.value === '') {
                setBaseFee(null);
              } else {
                setBaseFee(Number(e.target.value));
              }
            }}
          />
        </div>
      </div>

      <Separator />

      {/* On-chain Fee */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t('openChannel.onChainFee')}{' '}
            <span className="text-foreground">
              <Price amount={fee * 223} />
            </span>
            {fetchFees && !dontShow && (
              <Badge variant="secondary" className="ml-1.5">
                {t('openChannel.minFee', { minimum })}
              </Badge>
            )}
          </span>
          {fetchFees && !dontShow && (
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={type}
              onValueChange={value => {
                if (!value) return;
                if (value === 'none') {
                  setType('none');
                  setFee(fast);
                } else {
                  setFee(0);
                  setType('fee');
                }
              }}
            >
              <ToggleGroupItem value="none">
                {t('openChannel.auto')}
              </ToggleGroupItem>
              <ToggleGroupItem value="fee">
                {t('openChannel.custom')}
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>

        {type === 'none' ? (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="w-full"
            value={feeSpeedValue}
            onValueChange={value => {
              if (!value) return;
              if (value === 'fast') setFee(fast);
              else if (value === 'half') setFee(halfHour);
              else if (value === 'hour') setFee(hour);
            }}
          >
            {dedupedFees.map(f => (
              <ToggleGroupItem key={f.value} value={f.value} className="flex-1">
                {f.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : (
          <Input
            placeholder={t('openChannel.feePlaceholder')}
            type="number"
            onChange={e => setFee(Number(e.target.value))}
          />
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-2 text-muted-foreground"
        onClick={() => {
          setShowAdvanced(s => {
            if (s) {
              setPrivateChannel(false);
              setPushType('none');
              setPushTokens(0);
            }
            return !s;
          });
        }}
      >
        <ChevronDown
          size={14}
          className={showAdvanced ? 'rotate-180 transition' : 'transition'}
        />
        {t('openChannel.advanced')}
      </Button>

      {showAdvanced && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t('openChannel.type')}
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={privateChannel ? 'private' : 'public'}
              onValueChange={value => {
                if (value) setPrivateChannel(value === 'private');
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

          <div className="flex flex-col gap-2 rounded border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-destructive">
                  {t('openChannel.pushTitle')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('openChannel.pushDescription')}
                </span>
              </div>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={pushType}
                onValueChange={value => {
                  if (value) setPushType(value);
                }}
              >
                <ToggleGroupItem value="none">
                  {t('openChannel.pushNone')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="half"
                  className="data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive"
                >
                  {t('openChannel.pushHalf')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="custom"
                  className="data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive"
                >
                  {t('openChannel.pushCustom')}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {pushType === 'custom' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('openChannel.amount')}{' '}
                  <span className="text-destructive">
                    <Price amount={Math.min(pushTokens, size * 0.9)} />
                  </span>
                </label>
                <Input
                  placeholder={
                    size > 0
                      ? t('openChannel.pushPlaceholderMax', {
                          max: Math.floor(size * 0.9),
                        })
                      : t('openChannel.satsPlaceholder')
                  }
                  type="number"
                  value={pushTokens > 0 ? pushTokens : ''}
                  onChange={e => setPushTokens(Number(e.target.value))}
                />
              </div>
            )}

            {pushType !== 'none' && pushAmount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertTriangle size={14} className="shrink-0" />
                <span>
                  {t('openChannel.youWillLose')} <Price amount={pushAmount} />{' '}
                  {t('openChannel.whenOpens')}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {confirming ? (
        <div className="mt-1 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={loading}
            onClick={() => setConfirming(false)}
          >
            {t('openChannel.cancel')}
          </Button>
          <Button
            variant="default"
            className="flex-1"
            disabled={loading}
            onClick={() =>
              openChannel({
                variables: {
                  input: {
                    channel_size: size,
                    is_recommended: useRecommended,
                    partner_public_key: publicKey || '',
                    is_private: privateChannel,
                    is_max_funding: isMaxFunding,
                    give_tokens: pushAmount,
                    chain_fee_tokens_per_vbyte: fee,
                    base_fee_mtokens:
                      baseFee == null ? undefined : baseFee * 1000 + '',
                    fee_rate: feeRate,
                  },
                },
              })
            }
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              t('openChannel.confirmOpen')
            )}
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="mt-1 w-full"
          disabled={!canOpen || loading}
          onClick={() => setConfirming(true)}
        >
          {t('openChannel.open')} <ChevronRight size={18} />
        </Button>
      )}
    </div>
  );
};
