import {
  isOutgoingCandidate,
  mapWithConcurrency,
  sortFeeEstimates,
  spendableBalance,
  toFeeEstimate,
} from './invoices.helpers';

const channel = {
  id: '975668x497x0',
  partner_public_key: '02aa',
  local_balance: 999056,
  local_reserve: 10000,
  is_active: true,
};

const route = (fee: number, fee_mtokens: string, hops: number) => ({
  route: {
    fee,
    fee_mtokens,
    hops: Array.from({ length: hops }, () => ({
      channel: '1x1x1',
      channel_capacity: 1,
      fee: 0,
      fee_mtokens: '0',
      forward: 1,
      forward_mtokens: '1000',
      public_key: '02bb',
      timeout: 1,
    })),
    mtokens: '1000',
    safe_fee: Math.ceil(Number(fee_mtokens) / 1000),
    safe_tokens: 1,
    timeout: 1,
    tokens: 1,
  },
});

describe('invoices helpers', () => {
  describe('spendableBalance', () => {
    it('keeps the local reserve aside', () => {
      expect(spendableBalance(channel)).toBe(989056);
    });

    it('never goes below zero', () => {
      expect(spendableBalance({ ...channel, local_balance: 0 })).toBe(0);
    });
  });

  describe('isOutgoingCandidate', () => {
    it('takes active channels only, not opening or closing', () => {
      expect(isOutgoingCandidate(channel)).toBe(true);
      expect(isOutgoingCandidate({ ...channel, is_active: false })).toBe(false);
      expect(isOutgoingCandidate({ ...channel, is_closing: true })).toBe(false);
      expect(isOutgoingCandidate({ ...channel, is_opening: true })).toBe(false);
    });
  });

  describe('toFeeEstimate', () => {
    it('reports the rounded up fee and the hop count', () => {
      expect(toFeeEstimate(channel, route(2, '2020', 3))).toEqual({
        channel: '975668x497x0',
        partner_public_key: '02aa',
        local_balance: 999056,
        fee: 3,
        fee_mtokens: '2020',
        hops: 3,
      });
    });

    it('flags no route and failed queries', () => {
      expect(toFeeEstimate(channel, {}).error).toBe('no_route');
      expect(toFeeEstimate(channel, undefined, new Error('x')).error).toBe(
        'error'
      );
    });
  });

  describe('sortFeeEstimates', () => {
    it('puts the cheapest route first and rows without route last', () => {
      const rows = [
        { ...toFeeEstimate(channel, {}), channel: 'a' },
        { ...toFeeEstimate(channel, route(3, '3012', 4)), channel: 'b' },
        { ...toFeeEstimate(channel, route(2, '2020', 3)), channel: 'c' },
        { ...toFeeEstimate(channel, route(2, '2020', 2)), channel: 'd' },
      ];
      expect(sortFeeEstimates(rows).map(r => r.channel)).toEqual([
        'd',
        'c',
        'b',
        'a',
      ]);
    });
  });

  describe('mapWithConcurrency', () => {
    it('keeps the order and caps calls in flight', async () => {
      let inFlight = 0;
      let peak = 0;
      const result = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async n => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await new Promise(resolve => setTimeout(resolve, 5));
        inFlight--;
        return n * 10;
      });
      expect(result).toEqual([10, 20, 30, 40, 50]);
      expect(peak).toBe(2);
    });
  });
});
