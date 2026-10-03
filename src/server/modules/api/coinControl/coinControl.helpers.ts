import { Psbt, Transaction } from 'bitcoinjs-lib';

/** Lowest fee rate the XBT network relays. */
export const MIN_FEE_RATE_SAT_VBYTE = 0.1;
/** Most pools only mine transactions paying at least this rate. */
export const COMMON_MINING_FEE_RATE_SAT_VBYTE = 1;
export const MAX_FEE_RATE_SAT_VBYTE = 10_000;

export type Outpoint = { transaction_id: string; transaction_vout: number };

export type WalletUtxo = Outpoint & {
  tokens: number;
  address_format?: string;
  confirmation_count?: number;
};

export const asOutpoint = ({ transaction_id, transaction_vout }: Outpoint) =>
  `${transaction_id}:${transaction_vout}`;

/** Keeps at most 3 decimals so 0.1 stays 0.1 instead of 0.1000000004. */
const roundRate = (n: number) => Math.round(n * 1000) / 1000;

export const validateFeeRate = (rate: number): string | null => {
  if (!Number.isFinite(rate)) return 'Invalid fee rate';
  if (rate < MIN_FEE_RATE_SAT_VBYTE) {
    return `Fee rate must be at least ${MIN_FEE_RATE_SAT_VBYTE} sat/vB`;
  }
  if (rate > MAX_FEE_RATE_SAT_VBYTE) {
    return `Fee rate must be at most ${MAX_FEE_RATE_SAT_VBYTE} sat/vB`;
  }
  return null;
};

/**
 * Converts sat/vB (decimals allowed) to the sat/kw LND's FundPsbt expects.
 *
 * 1 vB = 4 weight units, so 1 sat/vB = 250 sat/kw. A plain `rate * 250`
 * lands just under the requested rate once LND rounds the transaction size,
 * which at 0.1 sat/vB is below the minimum relay fee; one extra sat/kw keeps
 * the final transaction at or above the requested rate.
 */
export const feeRateToSatPerKw = (satPerVbyte: number): number => {
  const error = validateFeeRate(satPerVbyte);
  if (error) throw new Error(error);
  return Math.ceil(roundRate(satPerVbyte * 250)) + 1;
};

// Virtual sizes of the inputs/outputs a LND wallet can produce.
const INPUT_VBYTES: Record<string, number> = {
  p2tr: 57.5,
  p2wpkh: 68,
  np2wpkh: 91,
};
const DEFAULT_INPUT_VBYTES = 68;
const TX_OVERHEAD_VBYTES = 10.5;
/** P2WSH and P2TR outputs (channel funding, taproot change) */
export const WIDE_OUTPUT_VBYTES = 43;

export const inputVbytes = (addressFormat?: string): number =>
  (addressFormat && INPUT_VBYTES[addressFormat]) || DEFAULT_INPUT_VBYTES;

/** Estimated size of a signed transaction spending the given inputs. */
export const estimateVsize = (
  inputFormats: (string | undefined)[],
  outputCount: number
): number =>
  Math.ceil(
    TX_OVERHEAD_VBYTES +
      inputFormats.reduce((sum, f) => sum + inputVbytes(f), 0) +
      outputCount * WIDE_OUTPUT_VBYTES
  );

/**
 * Picks the wallet UTXOs matching the requested outpoints, rejecting
 * duplicates, unknown outpoints and selections that can not fund `amount`.
 */
export const selectUtxos = (
  utxos: WalletUtxo[],
  outpoints: Outpoint[],
  amount: number
): { selected: WalletUtxo[]; total: number } => {
  if (!outpoints.length) throw new Error('Select at least one UTXO');

  const keys = outpoints.map(asOutpoint);
  if (new Set(keys).size !== keys.length) {
    throw new Error('The same UTXO was selected more than once');
  }

  const byOutpoint = new Map(utxos.map(u => [asOutpoint(u), u]));
  const selected = keys.map(key => {
    const utxo = byOutpoint.get(key);
    if (!utxo) throw new Error(`UTXO ${key} is not available in the wallet`);
    return utxo;
  });

  const total = selected.reduce((sum, u) => sum + u.tokens, 0);

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Invalid channel amount');
  }
  if (total <= amount) {
    throw new Error(
      `Selected UTXOs (${total} sats) do not cover the channel amount (${amount} sats) plus fees`
    );
  }

  return { selected, total };
};

/**
 * Largest channel that the selected coins can fund without change at the
 * given fee rate (a small margin covers LND's own size estimate).
 */
export const maxChannelAmount = (
  utxos: Pick<WalletUtxo, 'tokens' | 'address_format'>[],
  satPerVbyte: number
): number => {
  const total = utxos.reduce((sum, u) => sum + u.tokens, 0);
  const vsize = estimateVsize(
    utxos.map(u => u.address_format),
    1
  );
  const fee = Math.ceil(((feeRateToSatPerKw(satPerVbyte) * 4) / 1000) * vsize);
  return Math.max(0, total - fee - 2);
};

export type PsbtSummary = {
  inputs: (Outpoint & { tokens: number })[];
  outputs: { index: number; tokens: number; is_change: boolean }[];
  input_total: number;
  channel_amount: number;
  change: number;
  fee: number;
  estimated_vsize: number;
  estimated_fee_rate: number;
};

/**
 * Summarises a funded (unsigned) PSBT for the user to review.
 * Input amounts come from the PSBT's witness UTXOs, falling back to the
 * wallet UTXO list.
 */
export const summarizeFundedPsbt = ({
  psbt,
  changeIndex,
  utxos,
}: {
  psbt: string;
  changeIndex: number;
  utxos: WalletUtxo[];
}): PsbtSummary => {
  const packet = Psbt.fromHex(psbt);
  const tx = packet.txInputs;
  const byOutpoint = new Map(utxos.map(u => [asOutpoint(u), u]));

  const inputs = tx.map((input, i) => {
    const outpoint = {
      transaction_id: Buffer.from(input.hash).reverse().toString('hex'),
      transaction_vout: input.index,
    };
    const witness = packet.data.inputs[i]?.witnessUtxo;
    const tokens =
      witness !== undefined
        ? Number(witness.value)
        : byOutpoint.get(asOutpoint(outpoint))?.tokens;
    if (tokens === undefined) {
      throw new Error(`Unknown amount for input ${asOutpoint(outpoint)}`);
    }
    return { ...outpoint, tokens };
  });

  const outputs = packet.txOutputs.map((output, index) => ({
    index,
    tokens: Number(output.value),
    is_change: index === changeIndex,
  }));

  const input_total = inputs.reduce((sum, i) => sum + i.tokens, 0);
  const output_total = outputs.reduce((sum, o) => sum + o.tokens, 0);
  const change = outputs
    .filter(o => o.is_change)
    .reduce((sum, o) => sum + o.tokens, 0);
  const fee = input_total - output_total;

  const estimated_vsize = estimateVsize(
    inputs.map(i => byOutpoint.get(asOutpoint(i))?.address_format),
    outputs.length
  );

  return {
    inputs,
    outputs,
    input_total,
    channel_amount: output_total - change,
    change,
    fee,
    estimated_vsize,
    estimated_fee_rate: roundRate(fee / estimated_vsize),
  };
};

export const transactionIdFromHex = (hex: string): string =>
  Transaction.fromHex(hex).getId();

export const transactionVsize = (hex: string): number =>
  Transaction.fromHex(hex).virtualSize();

/** Size of a CPFP child spending one wallet output to one wallet output. */
export const CPFP_CHILD_VBYTES = Math.ceil(
  TX_OVERHEAD_VBYTES + INPUT_VBYTES.p2tr + WIDE_OUTPUT_VBYTES
);

/**
 * Fee rate the child must pay so parent + child together reach
 * `targetRate`. LND's BumpFee takes whole sat/vB, so the result is rounded
 * up and never below 1.
 */
export const cpfpChildFeeRate = ({
  parentVsize,
  parentFee,
  targetRate,
  childVsize = CPFP_CHILD_VBYTES,
}: {
  parentVsize: number;
  parentFee: number;
  targetRate: number;
  childVsize?: number;
}): { childRate: number; childFee: number; packageRate: number } => {
  if (!Number.isFinite(targetRate) || targetRate <= 0) {
    throw new Error('Invalid target fee rate');
  }
  const needed = targetRate * (parentVsize + childVsize) - parentFee;
  const childRate = Math.max(1, Math.ceil(roundRate(needed / childVsize)));
  const childFee = childRate * childVsize;
  return {
    childRate,
    childFee,
    packageRate: roundRate((parentFee + childFee) / (parentVsize + childVsize)),
  };
};

/** The largest wallet UTXO created by `transactionId`, if any. */
export const largestWalletOutput = <T extends WalletUtxo>(
  utxos: T[],
  transactionId: string
): T | undefined =>
  utxos
    .filter(u => u.transaction_id === transactionId)
    .sort((a, b) => b.tokens - a.tokens)[0];

/**
 * Upper bound LND's sweeper may spend on the child. Its fee function
 * starts at the requested rate and only climbs towards the budget as the
 * deadline approaches, so keep it close to the estimate (50% headroom).
 */
export const cpfpBudget = (childFee: number): number =>
  Math.ceil(childFee * 1.5);
