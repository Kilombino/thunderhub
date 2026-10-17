import { FC, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getTransactionLink } from '@/components/generic/helpers';
import { GetSpliceStatusQuery } from '@/graphql/queries/__generated__/getSpliceStatus.generated';
import { getLocale, t, TranslationKey } from '@/i18n';
import {
  isKnownRefusal,
  refusalText,
  spliceStateKey,
  spliceStatusText,
} from './splice.helpers';

export type SpliceChannel =
  GetSpliceStatusQuery['getSpliceStatus']['channels'][number];

export const formatSats = (sats: number): string =>
  `${sats.toLocaleString(getLocale())} sats`;

const signedSats = (sats: number): string =>
  `${sats > 0 ? '+' : ''}${formatSats(sats)}`;

export const stateText = (state: string): string => {
  const key = spliceStateKey(state);
  return key ? t(key) : state;
};

export const reasonText = (
  reason: string | null | undefined,
  fromPeer: boolean
): string => {
  if (fromPeer) return t('splice.last.peerSaid', { reason: reason || '' });
  const { key, vars } = refusalText(reason);
  return isKnownRefusal(reason) ? t(key, vars) : reason || t(key, vars);
};

export const InfoRow: FC<{ label: string; children: ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-center justify-between gap-3 px-3 py-1.5">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="font-medium text-right break-all">{children}</span>
  </div>
);

export const SpliceStatusBadge: FC<{ channel: SpliceChannel }> = ({
  channel,
}) => {
  const { key, vars } = spliceStatusText(channel.splice_status);
  return (
    <Badge
      variant={channel.can_splice ? 'secondary' : 'outline'}
      className={
        channel.can_splice
          ? 'h-auto whitespace-normal text-left text-green-600 dark:text-green-400'
          : 'h-auto whitespace-normal text-left text-muted-foreground'
      }
    >
      {t(key, vars)}
    </Badge>
  );
};

const initiatorText = (initiator: string): string =>
  t(`splice.initiator.${initiator}` as TranslationKey);

export const PendingSplice: FC<{
  pending: NonNullable<SpliceChannel['pending_splice']>;
}> = ({ pending }) => {
  const relay =
    pending.relay_status === 'rejected'
      ? t('splice.relay.rejected', { reason: pending.relay_reason || '' })
      : pending.relay_status === 'in_mempool'
        ? t('splice.relay.in_mempool')
        : pending.relay_status
          ? t('splice.relay.unknown')
          : null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium">{t('splice.pending.title')}</span>
      {pending.dead && (
        <div className="flex items-start gap-2 rounded border border-destructive/40 p-2 text-xs text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {t('splice.pending.dead')}
        </div>
      )}
      <div className="divide-y divide-border rounded border border-border text-xs">
        <InfoRow label={t('splice.pending.state')}>
          {stateText(pending.state)}
        </InfoRow>
        <InfoRow label={t('splice.pending.startedBy')}>
          {initiatorText(pending.initiator)}
        </InfoRow>
        <InfoRow label={t('splice.pending.confirmations')}>
          {t('splice.pending.confirmationsValue', {
            confirmations: pending.confirmations,
            depth: pending.lock_depth,
          })}
        </InfoRow>
        <InfoRow label={t('splice.pending.newCapacity')}>
          {formatSats(pending.new_capacity)}
        </InfoRow>
        <InfoRow label={t('splice.pending.localDelta')}>
          {signedSats(pending.local_delta)}
        </InfoRow>
        <InfoRow label={t('splice.pending.fee')}>
          {t('splice.pending.feeValue', {
            fee: pending.our_fee.toLocaleString(getLocale()),
            rate: pending.sat_per_vbyte,
          })}
        </InfoRow>
        {pending.txid && (
          <InfoRow label={t('splice.pending.txid')}>
            {getTransactionLink(pending.txid)}
          </InfoRow>
        )}
        {relay && <InfoRow label={t('splice.pending.relay')}>{relay}</InfoRow>}
        <InfoRow label={t('splice.pending.lockedLabel')}>
          {t('splice.pending.locked', {
            we: pending.we_locked
              ? t('splice.pending.yes')
              : t('splice.pending.no'),
            peer: pending.peer_locked
              ? t('splice.pending.yes')
              : t('splice.pending.no'),
          })}
        </InfoRow>
      </div>
    </div>
  );
};

export const LastSplice: FC<{
  last: NonNullable<SpliceChannel['last_splice']>;
}> = ({ last }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-medium">{t('splice.last.title')}</span>
    <div className="divide-y divide-border rounded border border-border text-xs">
      <InfoRow label={t('splice.last.outcome')}>
        {stateText(last.outcome)}
      </InfoRow>
      <InfoRow label={t('splice.pending.startedBy')}>
        {initiatorText(last.initiator)}
      </InfoRow>
      {last.local_delta !== 0 && (
        <InfoRow label={t('splice.pending.localDelta')}>
          {signedSats(last.local_delta)}
        </InfoRow>
      )}
      {last.time && (
        <InfoRow label={t('splice.last.when')}>
          {new Date(last.time).toLocaleString(getLocale())}
        </InfoRow>
      )}
      {last.txid && (
        <InfoRow label={t('splice.pending.txid')}>
          {getTransactionLink(last.txid)}
        </InfoRow>
      )}
      {last.reason && (
        <InfoRow label={t('splice.result.reason')}>
          {reasonText(last.reason, last.reason_from_peer)}
        </InfoRow>
      )}
    </div>
  </div>
);

/** Status, splice in progress and last splice of one channel. */
export const SpliceChannelSummary: FC<{ channel: SpliceChannel }> = ({
  channel,
}) => (
  <div className="flex flex-col gap-3">
    <div className="divide-y divide-border rounded border border-border text-xs">
      <InfoRow label={t('splice.columns.status')}>
        <SpliceStatusBadge channel={channel} />
      </InfoRow>
      <InfoRow label={t('splice.columns.capacity')}>
        {formatSats(channel.capacity)}
      </InfoRow>
      <InfoRow label={t('splice.columns.local')}>
        {formatSats(channel.local_balance)}
      </InfoRow>
    </div>
    {channel.pending_splice && (
      <PendingSplice pending={channel.pending_splice} />
    )}
    {channel.last_splice && <LastSplice last={channel.last_splice} />}
  </div>
);
