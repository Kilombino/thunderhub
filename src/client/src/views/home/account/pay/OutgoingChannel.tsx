import { FC, useMemo } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetChannelsQuery } from '@/graphql/queries/__generated__/getChannels.generated';
import { useEstimatePaymentFeesLazyQuery } from '@/graphql/queries/__generated__/estimatePaymentFees.generated';
import { Button } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Price } from '@/components/price/Price';
import { shorten } from '@/components/generic/helpers';
import { getErrorContent } from '@/utils/error';
import { cn } from '@/lib/utils';
import { t, TranslationKey } from '@/i18n';

type OutgoingChannelProps = {
  /** BOLT 11 invoice the fees are estimated for. */
  request: string;
  /** Outgoing channel id, '' for automatic. */
  value: string;
  onChange: (channel: string) => void;
  /** Max fee in sats the payment allows, to flag estimates above it. */
  maxFee?: number;
};

const ESTIMATE_ERRORS: Record<string, TranslationKey> = {
  insufficient_balance: 'wallet.pay.outgoing.insufficientBalance',
  no_route: 'wallet.pay.outgoing.noRoute',
};

const FeeAmount: FC<{ fee: number }> = ({ fee }) =>
  fee === 0 ? <>0 sats</> : <Price amount={fee} />;

/**
 * Picks the channel a Lightning payment leaves through. "Automatic" lets LND
 * pathfind over every channel; a chosen channel is passed as the outgoing
 * channel restriction. "Estimate fees" asks LND for a route out of each
 * channel (QueryRoutes, nothing is paid) and lists the fee of each one.
 */
export const OutgoingChannel: FC<OutgoingChannelProps> = ({
  request,
  value,
  onChange,
  maxFee,
}) => {
  const { data, loading } = useGetChannelsQuery();

  const channels = useMemo(
    () =>
      (data?.getChannels || []).filter(
        c => c.is_active && !c.is_closing && !c.is_opening && !c.asset
      ),
    [data]
  );

  const aliases = useMemo(() => {
    const map = new Map<string, string>();
    channels.forEach(c =>
      map.set(
        c.id,
        c.partner_node_info?.node?.alias || shorten(c.partner_public_key)
      )
    );
    return map;
  }, [channels]);

  const [estimate, { data: estimateData, loading: estimating, variables }] =
    useEstimatePaymentFeesLazyQuery({
      fetchPolicy: 'network-only',
      onError: error => toast.error(getErrorContent(error)),
    });

  const trimmed = request.trim();
  const estimates =
    variables?.request === trimmed ? estimateData?.estimatePaymentFees : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t('wallet.pay.outgoing.label')}
        </label>
        <div className="flex gap-2">
          {loading ? (
            <Loader2 className="animate-spin text-muted-foreground" size={16} />
          ) : (
            <NativeSelect
              className="w-full"
              value={value}
              onChange={e => onChange(e.target.value)}
            >
              <NativeSelectOption value="">
                {t('wallet.pay.outgoing.automatic')}
              </NativeSelectOption>
              {channels.map(c => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {t('wallet.pay.outgoing.option', {
                    alias: aliases.get(c.id) || c.id,
                    balance: c.local_balance.toLocaleString(),
                  })}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={!trimmed || estimating}
            onClick={() => estimate({ variables: { request: trimmed } })}
          >
            {estimating ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Calculator size={14} />
            )}
            <span className="ml-1">{t('wallet.pay.outgoing.estimate')}</span>
          </Button>
        </div>
      </div>

      {estimates && (
        <div className="flex flex-col gap-1">
          {!estimates.length ? (
            <div className="text-xs text-muted-foreground">
              {t('wallet.pay.outgoing.noChannels')}
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-popover text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-2 py-1.5 text-left font-medium">
                      {t('wallet.pay.outgoing.channel')}
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium">
                      {t('wallet.pay.outgoing.outbound')}
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium">
                      {t('wallet.pay.outgoing.fee')}
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium">
                      {t('wallet.pay.outgoing.hops')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map(row => {
                    const hasRoute = !row.error && row.fee != null;
                    const overMax =
                      hasRoute && !!maxFee && (row.fee as number) > maxFee;
                    const selected = row.channel === value;
                    return (
                      <tr
                        key={row.channel}
                        className={cn(
                          'border-b border-border last:border-0',
                          hasRoute
                            ? 'cursor-pointer hover:bg-muted/50'
                            : 'text-muted-foreground',
                          selected && 'bg-muted'
                        )}
                        title={row.channel}
                        onClick={() => hasRoute && onChange(row.channel)}
                      >
                        <td className="max-w-40 truncate px-2 py-1.5">
                          {aliases.get(row.channel) ||
                            shorten(row.partner_public_key)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">
                          <Price amount={row.local_balance} />
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-right font-mono',
                            overMax && 'text-destructive'
                          )}
                          title={
                            overMax
                              ? t('wallet.pay.outgoing.overMaxFee')
                              : undefined
                          }
                        >
                          {hasRoute ? (
                            <FeeAmount fee={row.fee as number} />
                          ) : (
                            t(
                              ESTIMATE_ERRORS[row.error || ''] ||
                                'wallet.pay.outgoing.failed'
                            )
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {hasRoute ? row.hops : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="text-[11px] text-muted-foreground">
            {t('wallet.pay.outgoing.estimateNote')}
          </div>
        </div>
      )}
    </div>
  );
};
