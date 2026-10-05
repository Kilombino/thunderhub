import { GetRouteToDestinationResult } from '../../node/lightning.types';
import { PaymentFeeEstimate } from './invoices.types';

export type FeeEstimateChannel = {
  id: string;
  partner_public_key: string;
  local_balance: number;
  local_reserve?: number;
  is_active?: boolean;
  is_closing?: boolean;
  is_opening?: boolean;
};

/**
 * What the channel can send right now, as LND sees it: the local balance
 * minus the reserve the channel has to keep on our side.
 */
export const spendableBalance = (channel: FeeEstimateChannel): number =>
  Math.max(0, channel.local_balance - (channel.local_reserve || 0));

/** Channels that may carry a payment out: active and not opening or closing. */
export const isOutgoingCandidate = (channel: FeeEstimateChannel): boolean =>
  !!channel.is_active && !channel.is_closing && !channel.is_opening;

/** Maps the QueryRoutes answer for one outgoing channel to a table row. */
export const toFeeEstimate = (
  channel: FeeEstimateChannel,
  result: GetRouteToDestinationResult | undefined,
  error?: unknown
): PaymentFeeEstimate => {
  const base = {
    channel: channel.id,
    partner_public_key: channel.partner_public_key,
    local_balance: channel.local_balance,
  };

  if (error) return { ...base, error: 'error' };

  const route = result?.route;
  if (!route) return { ...base, error: 'no_route' };

  return {
    ...base,
    fee: route.safe_fee,
    fee_mtokens: route.fee_mtokens,
    hops: route.hops.length,
  };
};

/** Cheapest first; rows without a route go last, keeping their order. */
export const sortFeeEstimates = (
  rows: PaymentFeeEstimate[]
): PaymentFeeEstimate[] =>
  [...rows].sort((a, b) => {
    const aHasRoute = !a.error;
    const bHasRoute = !b.error;
    if (aHasRoute !== bHasRoute) return aHasRoute ? -1 : 1;
    if (!aHasRoute) return 0;

    const byFee = BigInt(a.fee_mtokens || '0') - BigInt(b.fee_mtokens || '0');
    if (byFee !== BigInt(0)) return byFee < BigInt(0) ? -1 : 1;
    return (a.hops || 0) - (b.hops || 0);
  });

/** Runs `fn` over `items` with at most `limit` calls in flight. */
export const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
};
