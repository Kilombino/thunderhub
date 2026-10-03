import { useSyncExternalStore } from 'react';
import {
  Zap,
  Anchor,
  Users,
  Radio,
  Wallet,
  Gauge,
  Box,
  Server,
  CircleCheck,
} from 'lucide-react';
import { Price } from '../../components/price/Price';
import { useNodeInfo } from '../../hooks/UseNodeInfo';
import { useNodeBalances } from '../../hooks/UseNodeBalances';
import { useBitcoinFees } from '../../hooks/UseBitcoinFees';
import Big from 'big.js';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

const subscribeToTheme = (cb: () => void) => {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
};
const getIsDark = () => document.documentElement.classList.contains('dark');
const useIsDarkTheme = () => useSyncExternalStore(subscribeToTheme, getIsDark);

const hexToRgb = (hex: string) => {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
};

const getLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const pill =
  'flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 shrink-0 whitespace-nowrap';
const label = 'text-foreground font-medium';
const value = 'text-muted-foreground';
const separator = 'w-px h-3.5 bg-border shrink-0';

export const NodeInfoBar = () => {
  const {
    alias,
    color,
    syncedToChain,
    currentBlockHeight,
    activeChannelCount,
    pendingChannelCount,
    closedChannelCount,
    peersCount,
    latestBlockHeight,
  } = useNodeInfo();

  const { onchain, lightning } = useNodeBalances();

  const totalChain = new Big(onchain.confirmed).add(onchain.pending).toString();
  const totalLightning = new Big(lightning.confirmed)
    .add(lightning.pending)
    .toString();
  const totalBalance = new Big(totalChain).add(totalLightning).toString();

  const chainPending = Number(onchain.pending) + Number(onchain.closing);
  const channelPending = Number(lightning.pending);

  const syncPercentage =
    !!latestBlockHeight && currentBlockHeight > 0
      ? Math.min(Math.round((currentBlockHeight / latestBlockHeight) * 100), 99)
      : null;

  const {
    fast,
    halfHour,
    hour,
    minimum,
    dontShow: dontShowFees,
  } = useBitcoinFees();

  const isDark = useIsDarkTheme();

  if (!alias) return null;

  const { r, g, b } = hexToRgb(color);
  const lum = getLuminance(color);

  const mixColor = (
    cr: number,
    cg: number,
    cb: number,
    target: number,
    amount: number
  ) => ({
    r: Math.round(cr + (target - cr) * amount),
    g: Math.round(cg + (target - cg) * amount),
    b: Math.round(cb + (target - cb) * amount),
  });

  const getAliasStyle = () => {
    if ((!isDark && lum > 0.85) || (isDark && lum < 0.15)) {
      return {
        backgroundColor: `rgba(${r},${g},${b},0.15)`,
        color: 'var(--color-foreground)',
      };
    }
    const target = isDark ? 255 : 0;
    const mixAmount = isDark
      ? Math.max(0.2, 0.85 - lum)
      : Math.max(0.2, lum - 0.15);
    const mixed = mixColor(r, g, b, target, mixAmount);
    return {
      backgroundColor: `rgba(${r},${g},${b},${lum < 0.3 ? 0.25 : 0.15})`,
      color: `rgb(${mixed.r},${mixed.g},${mixed.b})`,
    };
  };

  const aliasStyle = getAliasStyle();

  return (
    <div className="flex items-center min-h-9 text-xs text-muted-foreground px-4 py-1.5 gap-3">
      {/* Node identity — pinned left */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div
          className="flex items-center gap-1 shrink-0 rounded-md px-2 py-0.5"
          style={{ backgroundColor: aliasStyle.backgroundColor }}
        >
          <Server size={11} style={{ color: aliasStyle.color }} />
          <span
            className="font-medium truncate max-w-35"
            style={{ color: aliasStyle.color }}
          >
            {alias}
          </span>
        </div>
        <Badge
          variant={syncedToChain ? 'secondary' : 'destructive'}
          className={cn(
            'shrink-0 text-[10px] rounded-sm',
            syncedToChain &&
              'bg-green-500/10 text-green-600 dark:text-green-400'
          )}
        >
          {syncedToChain ? (
            <>
              <CircleCheck size={10} />
              {t('nav.node.synced')}
            </>
          ) : (
            <>
              <Spinner className="size-3" />
              {syncPercentage
                ? t('nav.node.syncingPercent', { percent: syncPercentage })
                : t('nav.node.syncingDots')}
            </>
          )}
        </Badge>
      </div>

      {/* Stats — centered in remaining space */}
      <div className="flex items-center justify-center flex-1 flex-wrap gap-3">
        {/* Total balance */}
        <div className={pill}>
          <Wallet size={11} className="text-muted-foreground/60" />
          <span className={label}>{t('nav.bar.balance')}</span>
          <span className={value}>
            <Price amount={totalBalance} />
          </span>
        </div>

        {/* Lightning balance */}
        <div className={pill}>
          <Zap
            size={11}
            className={cn(
              'fill-current',
              channelPending === 0 ? 'text-yellow-500' : 'text-violet-500'
            )}
          />
          <span className={label}>{t('nav.bar.lightning')}</span>
          <span className={value}>
            <Price amount={totalLightning} />
          </span>
          {channelPending > 0 && (
            <span className="text-muted-foreground/50 text-[10px] inline-flex items-center gap-0.5">
              +<Price amount={String(lightning.pending)} />{' '}
              {t('nav.bar.pending')}
            </span>
          )}
        </div>

        {/* On-chain balance */}
        <div className={pill}>
          <Anchor
            size={11}
            className={cn(
              chainPending === 0 ? 'text-blue-400' : 'text-violet-500'
            )}
          />
          <span className={label}>{t('nav.bar.onchain')}</span>
          <span className={value}>
            <Price amount={totalChain} />
          </span>
          {chainPending > 0 && (
            <span className="text-muted-foreground/50 text-[10px] inline-flex items-center gap-0.5">
              +<Price amount={String(onchain.pending)} /> {t('nav.bar.pending')}
            </span>
          )}
        </div>

        <div className={separator} />

        {/* Channels */}
        <div className={pill}>
          <Radio size={11} className="text-emerald-500" />
          <span className={label}>{t('nav.bar.channels')}</span>
          <span className={value}>{activeChannelCount}</span>
          {pendingChannelCount > 0 && (
            <span className="text-muted-foreground/50 text-[10px]">
              {t('nav.bar.pendingCount', { count: pendingChannelCount })}
            </span>
          )}
          {closedChannelCount > 0 && (
            <span className="text-muted-foreground/50 text-[10px]">
              {t('nav.bar.closedCount', { count: closedChannelCount })}
            </span>
          )}
        </div>

        {/* Peers */}
        <div className={pill}>
          <Users size={11} className="text-violet-400" />
          <span className={label}>{t('nav.bar.peers')}</span>
          <span className={value}>{peersCount}</span>
        </div>

        <div className={separator} />

        {/* Mempool fees */}
        {!dontShowFees && (
          <div className={pill}>
            <Gauge size={11} className="text-orange-500" />
            <span className={value}>{fast} sat/vB</span>
            {halfHour !== fast && (
              <span className="text-muted-foreground/50">30m: {halfHour}</span>
            )}
            <span className="text-muted-foreground/50">1h: {hour}</span>
            <span className="text-muted-foreground/50">min: {minimum}</span>
          </div>
        )}

        <div className={separator} />

        {/* Block height */}
        {currentBlockHeight > 0 && (
          <div className={pill}>
            <Box size={11} className="text-sky-500" />
            <span className={label}>{t('nav.bar.block')}</span>
            <span className={value}>{currentBlockHeight.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};
