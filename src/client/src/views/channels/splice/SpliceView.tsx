import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  Scaling,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getNodeLink } from '@/components/generic/helpers';
import { useGetSpliceStatusQuery } from '@/graphql/queries/__generated__/getSpliceStatus.generated';
import { getErrorContent } from '@/utils/error';
import { t } from '@/i18n';
import { countStatuses, SPLICE_CONFIG_LINE } from './splice.helpers';
import {
  formatSats,
  SpliceChannel,
  SpliceChannelSummary,
  SpliceStatusBadge,
  stateText,
} from './SpliceInfo';
import { SpliceForm } from './SpliceForm';

/** While a splice is in progress the status is refreshed this often. */
const PENDING_POLL_MS = 30 * 1000;

export const useSpliceStatus = () => {
  const query = useGetSpliceStatusQuery({
    fetchPolicy: 'cache-and-network',
    onError: error => toast.error(getErrorContent(error)),
  });

  const anyPending = !!query.data?.getSpliceStatus.channels.some(
    channel => channel.pending_splice
  );
  const { startPolling, stopPolling } = query;

  useEffect(() => {
    if (anyPending) startPolling(PENDING_POLL_MS);
    else stopPolling();
    return () => stopPolling();
  }, [anyPending, startPolling, stopPolling]);

  return query;
};

export const NodeSpliceStatus: FC<{
  enabled: boolean;
  channels: SpliceChannel[];
}> = ({ enabled, channels }) => {
  const counts = countStatuses(channels);

  const copyLine = () =>
    navigator.clipboard
      .writeText(SPLICE_CONFIG_LINE)
      .then(() => toast.success(t('splice.node.copied')));

  return (
    <div className="flex flex-col gap-2 rounded border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{t('splice.node.title')}</span>
        {enabled ? (
          <Badge variant="secondary" className="text-green-600">
            <CheckCircle2 />
            {t('splice.node.enabled')}
          </Badge>
        ) : (
          <Badge variant="destructive">
            <XCircle />
            {t('splice.node.disabled')}
          </Badge>
        )}
      </div>

      {enabled ? (
        <p className="text-xs text-muted-foreground">
          {t('splice.node.enabledText')}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {t('splice.node.disabledText')}
          </p>
          <div className="flex items-center justify-between gap-2 rounded bg-muted px-3 py-2 font-mono text-xs">
            <span>
              [protocol]
              <br />
              {SPLICE_CONFIG_LINE}
            </span>
            <Button variant="outline" size="sm" onClick={copyLine}>
              <Copy className="mr-1 size-4" />
              {t('splice.node.copy')}
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded border border-orange-500/40 p-2 text-xs text-orange-600 dark:text-orange-400">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {t('splice.node.restartWarning')}
          </div>
        </>
      )}

      {channels.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t('splice.node.summary', {
            ready: counts.ready,
            unsupported: counts.unsupported,
            offline: counts.offline,
            other: counts.other,
          })}
        </p>
      )}
    </div>
  );
};

/**
 * Whether the form shows is decided when the channel is opened: once a
 * splice starts the channel reads "pending", and the form must stay to
 * show the result.
 */
const SpliceChannelBody: FC<{
  channel: SpliceChannel;
  onClose: () => void;
}> = ({ channel, onClose }) => {
  const [withForm] = useState(channel.can_splice);
  return (
    <>
      {channel.splice_status === 'disabled' && (
        <NodeSpliceStatus enabled={false} channels={[]} />
      )}
      <SpliceChannelSummary channel={channel} />
      {withForm && <SpliceForm channel={channel} onDone={onClose} />}
    </>
  );
};

export const SpliceChannelDialog: FC<{
  channel: SpliceChannel | null;
  onClose: () => void;
}> = ({ channel, onClose }) => (
  <Dialog open={!!channel} onOpenChange={open => !open && onClose()}>
    <DialogContent
      className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      // Splicing is a multi-step flow: only the close button ends it.
      onInteractOutside={e => e.preventDefault()}
      onEscapeKeyDown={e => e.preventDefault()}
    >
      {channel && (
        <>
          <DialogHeader>
            <DialogTitle>
              {t('splice.action')}:{' '}
              {channel.peer_alias || channel.partner_public_key.slice(0, 16)}
            </DialogTitle>
            <DialogDescription>{t('splice.intro')}</DialogDescription>
          </DialogHeader>
          <SpliceChannelBody
            key={channel.original_channel_point}
            channel={channel}
            onClose={onClose}
          />
        </>
      )}
    </DialogContent>
  </Dialog>
);

export const SpliceView = () => {
  const { data, loading, error, refetch } = useSpliceStatus();
  const [selected, setSelected] = useState<string | null>(null);

  const status = data?.getSpliceStatus;
  const channels = [...(status?.channels || [])].sort(
    (a, b) =>
      Number(b.can_splice) - Number(a.can_splice) ||
      Number(!!b.pending_splice) - Number(!!a.pending_splice) ||
      b.capacity - a.capacity
  );
  const selectedChannel =
    channels.find(channel => channel.original_channel_point === selected) ||
    null;

  if (loading && !status) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (!status) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        {t('splice.loadError', { error: error?.message || '' })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t('splice.title')}</span>
          <p className="text-xs text-muted-foreground">{t('splice.intro')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1 size-4" />
          {t('splice.refresh')}
        </Button>
      </div>

      <NodeSpliceStatus
        enabled={status.node_enabled}
        channels={status.channels}
      />

      {channels.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('splice.empty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('splice.columns.peer')}</TableHead>
              <TableHead className="text-right">
                {t('splice.columns.capacity')}
              </TableHead>
              <TableHead className="text-right">
                {t('splice.columns.local')}
              </TableHead>
              <TableHead>{t('splice.columns.status')}</TableHead>
              <TableHead>{t('splice.columns.progress')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map(channel => (
              <TableRow key={channel.channel_point}>
                <TableCell className="whitespace-nowrap">
                  {getNodeLink(channel.partner_public_key, channel.peer_alias)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatSats(channel.capacity)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatSats(channel.local_balance)}
                </TableCell>
                <TableCell className="max-w-64">
                  <SpliceStatusBadge channel={channel} />
                </TableCell>
                <TableCell className="text-xs">
                  {channel.pending_splice
                    ? `${stateText(channel.pending_splice.state)} (${
                        channel.pending_splice.confirmations
                      }/${channel.pending_splice.lock_depth})`
                    : channel.last_splice
                      ? stateText(channel.last_splice.outcome)
                      : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(channel.original_channel_point)}
                  >
                    <Scaling className="mr-1 size-4" />
                    {t('splice.action')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SpliceChannelDialog
        channel={selectedChannel}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

/**
 * The resize dialog for one channel, opened from the channels table by its
 * channel point (current or original).
 */
export const SpliceChannelByPoint: FC<{
  channelPoint: string;
  onClose: () => void;
}> = ({ channelPoint, onClose }) => {
  const { data, loading } = useSpliceStatus();
  const [original, setOriginal] = useState<string | null>(null);

  const channels = data?.getSpliceStatus.channels || [];
  const channel =
    channels.find(c =>
      original
        ? c.original_channel_point === original
        : c.channel_point === channelPoint ||
          c.original_channel_point === channelPoint
    ) || null;

  // Keep following the channel by the outpoint a splice never changes.
  useEffect(() => {
    if (channel && !original) setOriginal(channel.original_channel_point);
  }, [channel, original]);

  useEffect(() => {
    if (!loading && data && !channel) {
      toast.error(t('splice.channelNotFound'));
      onClose();
    }
  }, [loading, data, channel, onClose]);

  return <SpliceChannelDialog channel={channel} onClose={onClose} />;
};
