import {
  LastSpliceInfo,
  PendingSpliceInfo,
  SpliceChannelInfo,
  SpliceEstimate,
  SpliceInput,
  SpliceResult,
} from './splice.types';

/** option_splice feature bits (BOLT 2): required and optional. */
export const SPLICE_FEATURE_BITS = [62, 63];

/**
 * splice_status values that let a splice start. "peer_not_announcing" only
 * means the peer never sent its half of the last splice's announcement.
 */
const STARTABLE_STATUSES = ['ok', 'peer_not_announcing'];

/** States of a splice update after which the result is known. */
const DECISIVE_STATES = ['signed', 'broadcast', 'confirmed', 'locked'];

/** The most a single fee rate or confirmation target may be. */
const MAX_SAT_PER_VBYTE = 10000;
const MAX_TARGET_CONF = 1008;

export const canSplice = (status: string | null | undefined): boolean =>
  !!status && STARTABLE_STATUSES.includes(status);

/** Whether the node's GetInfo features announce option_splice. */
export const hasSpliceFeature = (
  features: { bit: number }[] | null | undefined
): boolean =>
  (features || []).some(feature => SPLICE_FEATURE_BITS.includes(feature.bit));

/**
 * Whether splicing is on in this node. The feature bits answer it even with
 * no channels; a channel saying "disabled" is the node saying no too.
 */
export const isNodeSpliceEnabled = (
  features: { bit: number }[] | null | undefined,
  statuses: string[]
): boolean => {
  if (statuses.includes('disabled')) return false;
  if (features) return hasSpliceFeature(features);
  return statuses.length > 0;
};

/**
 * LND's uint64 short channel id to the block x tx x output form the
 * lightning package (and so the rest of ThunderHub) uses.
 */
export const chanIdToScid = (chanId: string | null | undefined): string => {
  if (!chanId || !/^\d+$/.test(chanId)) return '';
  const id = BigInt(chanId);
  if (id === BigInt(0)) return '';
  const block = id >> BigInt(40);
  const tx = (id >> BigInt(16)) & BigInt(0xffffff);
  const output = id & BigInt(0xffff);
  return `${block}x${tx}x${output}`;
};

const toNumber = (value: unknown): number => Number(value || 0);
const orNull = (value: string | null | undefined): string | null =>
  value ? value : null;

export const mapInitiator = (value: unknown): string => {
  switch (value) {
    case 'INITIATOR_LOCAL':
      return 'local';
    case 'INITIATOR_REMOTE':
      return 'remote';
    case 'INITIATOR_BOTH':
      return 'both';
    default:
      return 'unknown';
  }
};

type RpcPendingSplice = {
  initiator?: string;
  state?: string;
  local_delta_sat?: string;
  remote_delta_sat?: string;
  fee_sat?: string;
  our_fee_sat?: string;
  sat_per_vbyte?: string;
  txid?: string;
  broadcast_height?: number;
  confirmations?: number;
  lock_depth?: number;
  we_locked?: boolean;
  peer_locked?: boolean;
  dead?: boolean;
  relay_status?: string;
  relay_reason?: string;
  new_channel_point?: string;
  new_capacity_sat?: string;
};

type RpcLastSplice = {
  initiator?: string;
  local_delta_sat?: string;
  remote_delta_sat?: string;
  txid?: string;
  time?: string;
  outcome?: string;
  reason?: string;
  reason_from_peer?: boolean;
};

export type RpcChannel = {
  active?: boolean;
  remote_pubkey?: string;
  channel_point?: string;
  chan_id?: string;
  capacity?: string;
  local_balance?: string;
  remote_balance?: string;
  private?: boolean;
  close_address?: string;
  peer_alias?: string;
  unified_sigs?: boolean;
  splice_status?: string;
  pending_splice?: RpcPendingSplice | null;
  last_splice?: RpcLastSplice | null;
  original_channel_point?: string;
  original_chan_id?: string;
};

export const mapPendingSplice = (
  pending: RpcPendingSplice | null | undefined
): PendingSpliceInfo | null => {
  if (!pending) return null;
  return {
    initiator: mapInitiator(pending.initiator),
    state: pending.state || '',
    local_delta: toNumber(pending.local_delta_sat),
    remote_delta: toNumber(pending.remote_delta_sat),
    fee: toNumber(pending.fee_sat),
    our_fee: toNumber(pending.our_fee_sat),
    sat_per_vbyte: toNumber(pending.sat_per_vbyte),
    txid: orNull(pending.txid),
    broadcast_height: toNumber(pending.broadcast_height),
    confirmations: toNumber(pending.confirmations),
    lock_depth: toNumber(pending.lock_depth),
    we_locked: !!pending.we_locked,
    peer_locked: !!pending.peer_locked,
    dead: !!pending.dead,
    relay_status: orNull(pending.relay_status),
    relay_reason: orNull(pending.relay_reason),
    new_channel_point: orNull(pending.new_channel_point),
    new_capacity: toNumber(pending.new_capacity_sat),
  };
};

export const mapLastSplice = (
  last: RpcLastSplice | null | undefined
): LastSpliceInfo | null => {
  if (!last) return null;
  const time = toNumber(last.time);
  return {
    initiator: mapInitiator(last.initiator),
    local_delta: toNumber(last.local_delta_sat),
    remote_delta: toNumber(last.remote_delta_sat),
    txid: orNull(last.txid),
    time: time ? new Date(time * 1000).toISOString() : null,
    outcome: last.outcome || '',
    reason: orNull(last.reason),
    reason_from_peer: !!last.reason_from_peer,
  };
};

/** LND puts an error in peer_alias when it has no alias for the node. */
const cleanAlias = (alias: string | undefined): string | null =>
  !alias || alias.startsWith('unable to lookup peer alias') ? null : alias;

export const mapSpliceChannel = (channel: RpcChannel): SpliceChannelInfo => {
  const status = channel.splice_status || '';
  return {
    id: chanIdToScid(channel.chan_id),
    channel_point: channel.channel_point || '',
    original_channel_point:
      channel.original_channel_point || channel.channel_point || '',
    original_id:
      chanIdToScid(channel.original_chan_id) || chanIdToScid(channel.chan_id),
    partner_public_key: channel.remote_pubkey || '',
    peer_alias: cleanAlias(channel.peer_alias),
    is_active: !!channel.active,
    is_private: !!channel.private,
    capacity: toNumber(channel.capacity),
    local_balance: toNumber(channel.local_balance),
    remote_balance: toNumber(channel.remote_balance),
    close_address: orNull(channel.close_address),
    unified_sigs: !!channel.unified_sigs,
    splice_status: status,
    can_splice: canSplice(status),
    pending_splice: mapPendingSplice(channel.pending_splice),
    last_splice: mapLastSplice(channel.last_splice),
  };
};

/** txid:index to an lnrpc ChannelPoint. */
export const parseChannelPoint = (
  value: string
): { funding_txid_str: string; output_index: number } => {
  const match = /^([0-9a-f]{64}):(\d{1,10})$/i.exec((value || '').trim());
  if (!match || Number(match[2]) > 0xffffffff) {
    throw new Error('Expected a channel point (txid:index)');
  }
  return {
    funding_txid_str: match[1].toLowerCase(),
    output_index: Number(match[2]),
  };
};

export type RpcSpliceRequest = {
  channel_point: { funding_txid_str: string; output_index: number };
  direction: 'SPLICE_IN' | 'SPLICE_OUT';
  amount_sat: string;
  use_max: boolean;
  sat_per_vbyte: string;
  target_conf: number;
  addr: string;
  force_low_fee?: boolean;
};

/**
 * Checks the GraphQL input and builds the EstimateSplice request, or the
 * SpliceChannel one with withForce (force_low_fee only exists there).
 */
export const buildSpliceRequest = (
  input: SpliceInput,
  withForce = false
): RpcSpliceRequest => {
  const channel_point = parseChannelPoint(input.channel_point);

  if (input.direction !== 'in' && input.direction !== 'out') {
    throw new Error('The direction must be "in" or "out"');
  }

  const use_max = !!input.use_max;
  const amount = use_max ? 0 : input.amount || 0;
  if (!use_max && (!Number.isSafeInteger(amount) || amount <= 0)) {
    throw new Error('The amount must be a whole number of sats, or max');
  }

  const rate = input.sat_per_vbyte || 0;
  if (!Number.isSafeInteger(rate) || rate < 0 || rate > MAX_SAT_PER_VBYTE) {
    throw new Error('The fee rate must be a whole number of sat/vB');
  }

  const target = input.target_conf || 0;
  if (!Number.isInteger(target) || target < 0 || target > MAX_TARGET_CONF) {
    throw new Error(
      `The confirmation target must be between 1 and ${MAX_TARGET_CONF}`
    );
  }

  const request: RpcSpliceRequest = {
    channel_point,
    direction: input.direction === 'in' ? 'SPLICE_IN' : 'SPLICE_OUT',
    amount_sat: String(amount),
    use_max,
    sat_per_vbyte: String(rate),
    target_conf: target,
    addr: input.direction === 'out' ? (input.address || '').trim() : '',
  };

  if (withForce) request.force_low_fee = !!input.force_low_fee;

  return request;
};

type RpcEstimate = {
  fee_sat?: string;
  vbytes?: string;
  sat_per_vbyte?: string;
  amount_sat?: string;
  min_sat?: string;
  max_in_sat?: string;
  max_out_sat?: string;
  min_sat_per_vbyte?: string;
  fee_estimate_source?: string;
  anchor_reserve_sat?: string;
  new_capacity_sat?: string;
  new_local_sat?: string;
  lock_depth?: number;
  destination_is_ours?: boolean;
  refusal_code?: string;
};

export const mapSpliceEstimate = (res: RpcEstimate): SpliceEstimate => ({
  fee: toNumber(res.fee_sat),
  vbytes: toNumber(res.vbytes),
  sat_per_vbyte: toNumber(res.sat_per_vbyte),
  amount: toNumber(res.amount_sat),
  min: toNumber(res.min_sat),
  max_in: toNumber(res.max_in_sat),
  max_out: toNumber(res.max_out_sat),
  min_sat_per_vbyte: toNumber(res.min_sat_per_vbyte),
  fee_estimate_source: res.fee_estimate_source || '',
  anchor_reserve: toNumber(res.anchor_reserve_sat),
  new_capacity: toNumber(res.new_capacity_sat),
  new_local: toNumber(res.new_local_sat),
  lock_depth: toNumber(res.lock_depth),
  destination_is_ours: !!res.destination_is_ours,
  refusal_code: orNull(res.refusal_code),
});

type RpcSpliceUpdate = {
  state?: string;
  txid?: string;
  new_channel_point?: string;
  confirmations?: number;
  reason?: string;
  reason_from_peer?: boolean;
};

export const mapSpliceUpdate = (
  update: RpcSpliceUpdate,
  timed_out = false
): SpliceResult => ({
  state: update.state || '',
  txid: orNull(update.txid),
  new_channel_point: orNull(update.new_channel_point),
  confirmations: toNumber(update.confirmations),
  reason: orNull(update.reason),
  reason_from_peer: !!update.reason_from_peer,
  timed_out,
});

/** Whether a splice update tells how the splice went: agreed or aborted. */
export const isDecisiveUpdate = (state: string | null | undefined): boolean =>
  state === 'aborted' || DECISIVE_STATES.includes(state || '');
