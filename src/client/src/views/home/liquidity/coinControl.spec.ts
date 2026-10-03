import {
  feeRateToSatPerKw,
  maxChannelAmount,
  parseFeeRate,
} from './coinControl';

describe('client coin control helpers', () => {
  it('matches the server fee conversion', () => {
    expect(feeRateToSatPerKw(0.1)).toBe(26);
    expect(feeRateToSatPerKw(1.1)).toBe(276);
  });

  it('accepts decimal commas', () => {
    expect(parseFeeRate('0,5')).toBe(0.5);
  });

  it('computes the change-less maximum', () => {
    expect(
      maxChannelAmount([{ tokens: 50_000, address_format: 'p2tr' }], 0.1)
    ).toBe(50_000 - 12 - 2);
    expect(maxChannelAmount([], 1)).toBe(0);
    expect(
      maxChannelAmount([{ tokens: 1, address_format: 'p2tr' }], 0.05)
    ).toBe(0);
  });
});
