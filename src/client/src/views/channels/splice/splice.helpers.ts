import type { TranslationKey } from '../../../i18n';

/** The lnd.conf line that turns splicing on, in the [protocol] section. */
export const SPLICE_CONFIG_LINE = 'protocol.splice=true';

const STATUSES = [
  'ok',
  'disabled',
  'peer_offline',
  'peer_unsupported',
  'no_unified_sigs',
  'taproot',
  'zero_conf',
  'pending',
  'closing',
  'funding_spent_unknown',
  'peer_not_locked',
  'peer_misbehaved',
  'peer_not_announcing',
];

const REASONS = [
  'insufficient_funds',
  'immature_inputs',
  'below_min',
  'above_max_out',
  'fee_below_floor',
  'reserve_on_change',
  'close_address_set',
  'node_cap',
  'too_many_splices',
  'too_many_aborts',
  'not_quiescent',
  'above_max_size',
  'above_balance',
  'chain_not_synced',
  'timeout',
  'rbf_unsupported',
  'invalid_commitment',
  'invalid_signatures',
  'locktime',
  'internal_error',
  'peer_contribution_unsupported',
  'peer_disconnected',
];

const STATES = [
  'preparing',
  'negotiating',
  'signed',
  'broadcast',
  'confirmed',
  'locked',
  'aborted',
  'dead',
];

export type Translated = { key: TranslationKey; vars?: Record<string, string> };

/**
 * A refusal code may come alone ("peer_offline") or followed by details
 * ("above_max_out: 5000 out, 4000 available"): the code is the first word.
 */
export const reasonCode = (value: string | null | undefined): string => {
  const match = /^\s*([a-z][a-z_]*)/.exec(value || '');
  return match ? match[1] : '';
};

/** Human text for a channel's splice_status; unknown values read "not now". */
export const spliceStatusText = (
  status: string | null | undefined
): Translated =>
  status && STATUSES.includes(status)
    ? { key: `splice.status.${status}` as TranslationKey }
    : { key: 'splice.status.unknown', vars: { code: status || '?' } };

/**
 * Human text for a refusal code (EstimateSplice refusal_code, an aborted
 * splice's reason or a FailedPrecondition error), which may also be one of
 * the splice_status values.
 */
export const refusalText = (value: string | null | undefined): Translated => {
  const code = reasonCode(value);
  if (REASONS.includes(code)) {
    return { key: `splice.reasons.${code}` as TranslationKey };
  }
  if (code !== 'ok' && STATUSES.includes(code)) {
    return { key: `splice.status.${code}` as TranslationKey };
  }
  return { key: 'splice.reasons.unknown', vars: { code: value || '?' } };
};

/** Whether a refusal code is one of the known ones (else show it raw). */
export const isKnownRefusal = (value: string | null | undefined): boolean => {
  const code = reasonCode(value);
  return REASONS.includes(code) || (code !== 'ok' && STATUSES.includes(code));
};

export const spliceStateKey = (
  state: string | null | undefined
): TranslationKey | null =>
  state && STATES.includes(state)
    ? (`splice.states.${state}` as TranslationKey)
    : null;

export type StatusCounts = {
  ready: number;
  unsupported: number;
  offline: number;
  other: number;
};

export const countStatuses = (
  channels: { splice_status: string; can_splice: boolean }[]
): StatusCounts =>
  channels.reduce(
    (counts, channel) => {
      if (channel.can_splice) counts.ready += 1;
      else if (channel.splice_status === 'peer_unsupported')
        counts.unsupported += 1;
      else if (channel.splice_status === 'peer_offline') counts.offline += 1;
      else counts.other += 1;
      return counts;
    },
    { ready: 0, unsupported: 0, offline: 0, other: 0 }
  );

/**
 * A whole, positive number of sats from the amount field, or null. Spaces
 * and thousands separators (1.000.000 or 1,000,000) are accepted; a
 * fraction is not.
 */
export const parseSats = (value: string): number | null => {
  let clean = value.trim().replace(/[\s_]/g, '');
  if (/^\d{1,3}([.,]\d{3})+$/.test(clean)) clean = clean.replace(/[.,]/g, '');
  if (!/^\d+$/.test(clean)) return null;
  const sats = Number(clean);
  return Number.isSafeInteger(sats) && sats > 0 ? sats : null;
};

/**
 * A whole sat/vB rate from the fee field: null for empty (let LND pick),
 * NaN for anything that is not a whole number.
 */
export const parseWholeRate = (value: string): number | null => {
  const clean = value.trim();
  if (!clean) return null;
  if (!/^\d+$/.test(clean)) return NaN;
  return Number(clean);
};

/**
 * Whether an estimate lets the splice go ahead: no refusal, or only a fee
 * rate under the node floor that the user chose to force.
 */
export const canProceed = (
  refusal: string | null | undefined,
  forceLowFee: boolean
): boolean => {
  if (!refusal) return true;
  return reasonCode(refusal) === 'fee_below_floor' && forceLowFee;
};
