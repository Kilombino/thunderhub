import { Psbt } from 'bitcoinjs-lib';
import {
  CPFP_CHILD_VBYTES,
  asOutpoint,
  cpfpChildFeeRate,
  estimateVsize,
  largestWalletOutput,
  feeRateToSatPerKw,
  maxChannelAmount,
  selectUtxos,
  summarizeFundedPsbt,
  validateFeeRate,
} from './coinControl.helpers';

const txid = (n: number) => n.toString(16).padStart(64, '0');

const utxos = [
  {
    transaction_id: txid(1),
    transaction_vout: 0,
    tokens: 50_000,
    address_format: 'p2tr',
    confirmation_count: 3,
  },
  {
    transaction_id: txid(2),
    transaction_vout: 1,
    tokens: 30_000,
    address_format: 'p2wpkh',
    confirmation_count: 0,
  },
];

describe('feeRateToSatPerKw', () => {
  it('adds one sat/kw on top of the exact conversion', () => {
    expect(feeRateToSatPerKw(0.1)).toBe(26);
    expect(feeRateToSatPerKw(1)).toBe(251);
    expect(feeRateToSatPerKw(2.5)).toBe(626);
  });

  it('is not affected by floating point noise', () => {
    // 1.1 * 250 === 275.00000000000006 in IEEE 754
    expect(feeRateToSatPerKw(1.1)).toBe(276);
    expect(feeRateToSatPerKw(0.3)).toBe(76);
  });

  it('rounds partial sat/kw up', () => {
    expect(feeRateToSatPerKw(0.123)).toBe(32); // 30.75 -> 31 + 1
  });

  it('never goes below the minimum relay fee', () => {
    expect(feeRateToSatPerKw(0.1) / 250).toBeGreaterThanOrEqual(0.1);
  });

  it('rejects rates outside the allowed range', () => {
    expect(() => feeRateToSatPerKw(0.09)).toThrow();
    expect(() => feeRateToSatPerKw(0)).toThrow();
    expect(() => feeRateToSatPerKw(NaN)).toThrow();
    expect(() => feeRateToSatPerKw(20_000)).toThrow();
    expect(validateFeeRate(0.1)).toBeNull();
  });
});

describe('selectUtxos', () => {
  it('returns the selected coins and their total', () => {
    const { selected, total } = selectUtxos(utxos, [utxos[1]], 20_000);
    expect(selected).toEqual([utxos[1]]);
    expect(total).toBe(30_000);
  });

  it('rejects unknown, duplicated or insufficient selections', () => {
    expect(() => selectUtxos(utxos, [], 1)).toThrow('at least one');
    expect(() =>
      selectUtxos(utxos, [{ transaction_id: txid(9), transaction_vout: 0 }], 1)
    ).toThrow('not available');
    expect(() => selectUtxos(utxos, [utxos[0], utxos[0]], 1)).toThrow(
      'more than once'
    );
    expect(() => selectUtxos(utxos, [utxos[1]], 30_000)).toThrow(
      'do not cover'
    );
    expect(() => selectUtxos(utxos, [utxos[1]], 1.5)).toThrow('Invalid');
  });
});

describe('size estimates', () => {
  it('estimates the vsize of a funding transaction', () => {
    // 10.5 + 57.5 + 68 + 2 * 43 = 222
    expect(estimateVsize(['p2tr', 'p2wpkh'], 2)).toBe(222);
  });

  it('computes the largest change-less channel', () => {
    // vsize = ceil(10.5 + 57.5 + 43) = 111; 26 sat/kw = 0.104 sat/vB
    // fee = ceil(0.104 * 111) = 12, minus 2 sats margin
    expect(maxChannelAmount([utxos[0]], 0.1)).toBe(50_000 - 12 - 2);
  });
});

describe('summarizeFundedPsbt', () => {
  const fundingScript = Buffer.concat([
    Buffer.from([0x00, 0x20]),
    Buffer.alloc(32, 1),
  ]);
  const changeScript = Buffer.concat([
    Buffer.from([0x51, 0x20]),
    Buffer.alloc(32, 2),
  ]);

  const psbt = new Psbt();
  psbt.addInput({
    hash: utxos[0].transaction_id,
    index: 0,
    witnessUtxo: { script: changeScript, value: 50_000 },
  });
  psbt.addInput({
    hash: utxos[1].transaction_id,
    index: 1,
    witnessUtxo: { script: changeScript, value: 30_000 },
  });
  psbt.addOutput({ script: fundingScript, value: 60_000 });
  psbt.addOutput({ script: changeScript, value: 19_977 });

  it('reports inputs, channel amount, change and fee', () => {
    const summary = summarizeFundedPsbt({
      psbt: psbt.toHex(),
      changeIndex: 1,
      utxos,
    });

    expect(summary.inputs.map(asOutpoint)).toEqual(utxos.map(asOutpoint));
    expect(summary.input_total).toBe(80_000);
    expect(summary.channel_amount).toBe(60_000);
    expect(summary.change).toBe(19_977);
    expect(summary.fee).toBe(23);
    expect(summary.estimated_vsize).toBe(222);
    expect(summary.estimated_fee_rate).toBe(0.104);
  });

  it('handles funding without change', () => {
    const noChange = new Psbt();
    noChange.addInput({
      hash: utxos[0].transaction_id,
      index: 0,
      witnessUtxo: { script: changeScript, value: 50_000 },
    });
    noChange.addOutput({ script: fundingScript, value: 49_980 });

    const summary = summarizeFundedPsbt({
      psbt: noChange.toHex(),
      changeIndex: -1,
      utxos,
    });
    expect(summary.change).toBe(0);
    expect(summary.channel_amount).toBe(49_980);
    expect(summary.fee).toBe(20);
  });
});

describe('cpfpChildFeeRate', () => {
  it('pays for the parent to reach the package target', () => {
    // parent: 150 vB paying 15 sats (0.1 sat/vB), target 2 sat/vB
    const result = cpfpChildFeeRate({
      parentVsize: 150,
      parentFee: 15,
      targetRate: 2,
    });
    const needed = 2 * (150 + CPFP_CHILD_VBYTES) - 15;
    expect(result.childRate).toBe(Math.ceil(needed / CPFP_CHILD_VBYTES));
    expect(result.packageRate).toBeGreaterThanOrEqual(2);
  });

  it('never asks for less than 1 sat/vB', () => {
    expect(
      cpfpChildFeeRate({ parentVsize: 150, parentFee: 1_000, targetRate: 1 })
        .childRate
    ).toBe(1);
  });

  it('rejects invalid targets', () => {
    expect(() =>
      cpfpChildFeeRate({ parentVsize: 1, parentFee: 0, targetRate: 0 })
    ).toThrow();
  });
});

describe('largestWalletOutput', () => {
  it('finds the biggest wallet output of a transaction', () => {
    const list = [
      { transaction_id: txid(5), transaction_vout: 0, tokens: 10 },
      { transaction_id: txid(5), transaction_vout: 2, tokens: 99 },
      { transaction_id: txid(6), transaction_vout: 0, tokens: 1_000 },
    ];
    expect(largestWalletOutput(list, txid(5))?.transaction_vout).toBe(2);
    expect(largestWalletOutput(list, txid(7))).toBeUndefined();
  });
});
