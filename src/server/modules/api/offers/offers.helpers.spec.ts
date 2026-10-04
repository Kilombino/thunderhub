import {
  isBolt12Offer,
  isBolt12Payment,
  mapDecodedBolt12,
  mapPayOfferResult,
  normalizeBolt12,
  satsToMsat,
} from './offers.helpers';

describe('offers helpers', () => {
  describe('normalizeBolt12', () => {
    it('joins "+" continuations and drops whitespace', () => {
      expect(normalizeBolt12('  lno1qgsx+\n  lc5vp2 ')).toBe('lno1qgsxlc5vp2');
    });
  });

  describe('isBolt12Offer', () => {
    it('accepts offers in either case', () => {
      expect(isBolt12Offer('lno1qgsxlc5vp2m0rvmjcxn2y34wv0m5')).toBe(true);
      expect(isBolt12Offer('LNO1QGSXLC5VP2M0RVMJCXN2Y34WV0M5')).toBe(true);
    });

    it('rejects BOLT 11 invoices, BOLT 12 invoices and junk', () => {
      expect(isBolt12Offer('lnbc10u1pjqxyz')).toBe(false);
      expect(isBolt12Offer('lni1qqgsxlc5vp2m0rvmjcxn2y34wv0m5')).toBe(false);
      expect(isBolt12Offer('lno1bio')).toBe(false);
      expect(isBolt12Offer('')).toBe(false);
      expect(isBolt12Offer(undefined)).toBe(false);
    });
  });

  describe('satsToMsat', () => {
    it('converts whole sats to millisats', () => {
      expect(satsToMsat(1000)).toBe('1000000');
      expect(satsToMsat(0)).toBe('0');
      expect(satsToMsat(null)).toBe('0');
    });

    it('rejects fractions and negatives', () => {
      expect(() => satsToMsat(1.5)).toThrow();
      expect(() => satsToMsat(-1)).toThrow();
    });
  });

  describe('mapDecodedBolt12', () => {
    it('maps bytes to hex and expiry to ISO', () => {
      const decoded = mapDecodedBolt12({
        type: 'offer',
        for_this_chain: true,
        chains: [Buffer.from('6fe2', 'hex')],
        offer_id: Buffer.from('5a9d', 'hex'),
        valid: true,
        validation_error: '',
        ours: false,
        offer: {
          offer_id: Buffer.from('5a9d', 'hex'),
          description: 'Kilombino',
          issuer: '',
          amount_msat: '0',
          absolute_expiry: '1791671120',
          issuer_id: Buffer.from('0222', 'hex'),
          num_paths: 2,
          quantity_max: '0',
          quantity_any: false,
        },
      });

      expect(decoded).toEqual({
        type: 'offer',
        for_this_chain: true,
        chains: ['6fe2'],
        valid: true,
        validation_error: null,
        ours: false,
        offer: {
          offer_id: '5a9d',
          description: 'Kilombino',
          issuer: null,
          amount_msat: '0',
          absolute_expiry: new Date(1791671120 * 1000).toISOString(),
          issuer_id: '0222',
          num_paths: 2,
          quantity_max: 0,
          quantity_any: false,
        },
      });
    });

    it('leaves the offer out when the string has none', () => {
      expect(mapDecodedBolt12({ type: 'invoice' }).offer).toBeNull();
    });
  });

  describe('mapPayOfferResult', () => {
    it('maps the payment hash and preimage to hex', () => {
      expect(
        mapPayOfferResult({
          bolt12: 'lni1...',
          payment_hash: Buffer.from('4b5e', 'hex'),
          payment_preimage: Buffer.from('357c', 'hex'),
          amount_msat: '1000000',
          fee_msat: '3205',
        })
      ).toEqual({
        bolt12: 'lni1...',
        payment_hash: '4b5e',
        payment_preimage: '357c',
        amount_msat: '1000000',
        fee_msat: '3205',
      });
    });
  });

  describe('isBolt12Payment', () => {
    const blinded = {
      hops: [
        { channel: '975311x314x0' },
        { channel: '974611x224x0' },
        { channel: '0x0x0' },
        { channel: '0x0x0' },
      ],
    };
    const plain = { hops: [{ channel: '975311x314x0' }] };

    it('detects a payment over blinded paths with no request', () => {
      expect(isBolt12Payment({ attempts: [{ route: blinded }] })).toBe(true);
      expect(isBolt12Payment({ paths: [blinded] })).toBe(true);
    });

    it('does not flag BOLT 11 or keysend payments', () => {
      expect(
        isBolt12Payment({ request: 'lnbc1...', attempts: [{ route: blinded }] })
      ).toBe(false);
      expect(isBolt12Payment({ attempts: [{ route: plain }] })).toBe(false);
      expect(isBolt12Payment({ attempts: [] })).toBe(false);
    });
  });
});
