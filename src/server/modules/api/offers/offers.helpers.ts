import { createHash } from 'crypto';
import { DecodedBolt12, PayOfferResult } from './offers.types';

const MSAT_PER_SAT = 1000;

/**
 * BOLT 12 strings may be split with "+" followed by whitespace; readers
 * must join the parts back. Whitespace around the string is dropped too.
 */
export const normalizeBolt12 = (value: string): string =>
  value.trim().replace(/\+\s*/g, '').replace(/\s+/g, '');

/** Whether a pasted string is a BOLT 12 offer (lno1...). */
export const isBolt12Offer = (value: string | null | undefined): boolean =>
  !!value && /^lno1[02-9ac-hj-np-z]+$/i.test(normalizeBolt12(value));

const toHex = (value: unknown): string => {
  if (!value) return '';
  if (Buffer.isBuffer(value)) return value.toString('hex');
  if (value instanceof Uint8Array) return Buffer.from(value).toString('hex');
  return String(value);
};

const toNumber = (value: unknown): number => Number(value || 0);

/** Converts whole sats to a millisatoshi string, rejecting fractions. */
export const satsToMsat = (sats: number | null | undefined): string => {
  if (!sats) return '0';
  if (!Number.isSafeInteger(sats) || sats < 0) {
    throw new Error('The amount must be a whole number of sats');
  }
  return (BigInt(sats) * BigInt(MSAT_PER_SAT)).toString();
};

type RpcOffer = {
  offer_id?: unknown;
  description?: string;
  issuer?: string;
  amount_msat?: string;
  absolute_expiry?: string;
  issuer_id?: unknown;
  num_paths?: number;
  quantity_max?: string;
  quantity_any?: boolean;
};

type RpcDecodeBolt12Response = {
  type?: string;
  for_this_chain?: boolean;
  chains?: unknown[];
  offer_id?: unknown;
  offer?: RpcOffer | null;
  valid?: boolean;
  validation_error?: string;
  ours?: boolean;
};

type RpcPayOfferResponse = {
  bolt12?: string;
  payment_hash?: unknown;
  payment_preimage?: unknown;
  amount_msat?: string;
  fee_msat?: string;
};

export const mapDecodedBolt12 = (
  res: RpcDecodeBolt12Response
): DecodedBolt12 => {
  const offer = res.offer;
  const expiry = toNumber(offer?.absolute_expiry);

  return {
    type: res.type || '',
    for_this_chain: !!res.for_this_chain,
    chains: (res.chains || []).map(toHex),
    valid: !!res.valid,
    validation_error: res.validation_error || null,
    ours: !!res.ours,
    offer: offer
      ? {
          offer_id: toHex(offer.offer_id || res.offer_id),
          description: offer.description || null,
          issuer: offer.issuer || null,
          amount_msat: offer.amount_msat || '0',
          absolute_expiry: expiry
            ? new Date(expiry * 1000).toISOString()
            : null,
          issuer_id: toHex(offer.issuer_id) || null,
          num_paths: toNumber(offer.num_paths),
          quantity_max: toNumber(offer.quantity_max),
          quantity_any: !!offer.quantity_any,
        }
      : null,
  };
};

export const mapPayOfferResult = (
  res: RpcPayOfferResponse
): PayOfferResult => ({
  bolt12: res.bolt12 || '',
  payment_hash: toHex(res.payment_hash),
  payment_preimage: toHex(res.payment_preimage),
  amount_msat: res.amount_msat || '0',
  fee_msat: res.fee_msat || '0',
  receipt: null,
});

/** The fields of a decoded BOLT 12 invoice (lni1...) a receipt shows. */
export type DecodedInvoice = {
  payment_hash: string;
  node_id: string;
  payer_id: string;
  signature_valid: boolean;
  valid: boolean;
  chains: string[];
};

export const mapDecodedInvoice = (res: {
  type?: string;
  valid?: boolean;
  chains?: unknown[];
  invoice?: {
    payment_hash?: unknown;
    node_id?: unknown;
    payer_id?: unknown;
    signature_valid?: boolean;
  } | null;
}): DecodedInvoice | null => {
  if (res.type !== 'invoice' || !res.invoice) return null;
  return {
    payment_hash: toHex(res.invoice.payment_hash),
    node_id: toHex(res.invoice.node_id),
    payer_id: toHex(res.invoice.payer_id),
    signature_valid: !!res.invoice.signature_valid,
    valid: !!res.valid,
    chains: (res.chains || []).map(toHex),
  };
};

/** Whether SHA-256 of the preimage (hex) is the payment hash (hex). */
export const preimageMatches = (
  preimage: string,
  paymentHash: string
): boolean => {
  if (
    !/^[0-9a-f]{64}$/i.test(preimage) ||
    !/^[0-9a-f]{64}$/i.test(paymentHash)
  ) {
    return false;
  }
  const digest = createHash('sha256')
    .update(Buffer.from(preimage, 'hex'))
    .digest('hex');
  return digest === paymentHash.toLowerCase();
};

type RouteHops = { hops?: { channel?: string }[] };

/**
 * LND keeps no payment request for a BOLT 12 payment: PayOffer pays the
 * fetched lni1 invoice through blinded paths, so the record has an empty
 * payment_request and a route whose blinded hops carry no channel id.
 * Keysend and other spontaneous payments have no request either, but their
 * routes are made of real channels only.
 *
 * Takes a payment from getPayments (attempts) or getPayment (paths).
 */
export const isBolt12Payment = (payment: {
  request?: string | null;
  attempts?: { route?: RouteHops }[];
  paths?: RouteHops[];
}): boolean => {
  if (payment.request) return false;

  const routes = [
    ...(payment.attempts || []).map(attempt => attempt.route),
    ...(payment.paths || []),
  ];

  return routes.some(route =>
    (route?.hops || []).some(hop => hop.channel === '0x0x0')
  );
};
