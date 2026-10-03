// Client-side mirror of the server coin control maths
// (src/server/modules/api/coinControl/coinControl.helpers.ts), used only to
// pre-fill amounts and warn early. The server recomputes everything.

export const MIN_FEE_RATE = 0.1;

const INPUT_VBYTES: Record<string, number> = {
  p2tr: 57.5,
  p2wpkh: 68,
  np2wpkh: 91,
};

export const parseFeeRate = (value: string): number =>
  Number(value.replace(',', '.'));

export const feeRateToSatPerKw = (rate: number): number =>
  Math.ceil(Math.round(rate * 250 * 1000) / 1000) + 1;

export const estimateVsize = (formats: string[], outputs: number): number =>
  Math.ceil(
    10.5 +
      formats.reduce((sum, f) => sum + (INPUT_VBYTES[f] || 68), 0) +
      outputs * 43
  );

/** Largest channel the coins can fund without change at `rate` sat/vB. */
export const maxChannelAmount = (
  utxos: { tokens: number; address_format: string }[],
  rate: number
): number => {
  if (!utxos.length || !(rate >= MIN_FEE_RATE)) return 0;
  const total = utxos.reduce((sum, u) => sum + u.tokens, 0);
  const vsize = estimateVsize(
    utxos.map(u => u.address_format),
    1
  );
  const fee = Math.ceil(((feeRateToSatPerKw(rate) * 4) / 1000) * vsize);
  return Math.max(0, total - fee - 2);
};

export const outpointKey = (u: {
  transaction_id: string;
  transaction_vout: number;
}) => `${u.transaction_id}:${u.transaction_vout}`;
