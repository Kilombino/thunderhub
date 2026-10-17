import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PendingSpliceInfo {
  @Field({ description: 'local, remote, both or unknown' })
  initiator: string;
  @Field({
    description:
      'preparing, negotiating, signed, broadcast or confirmed (waiting for the lock depth)',
  })
  state: string;
  @Field({ description: 'Change to this node balance in the channel, sats' })
  local_delta: number;
  @Field({ description: 'Change to the peer balance in the channel, sats' })
  remote_delta: number;
  @Field()
  fee: number;
  @Field({ description: 'The part of the fee this node pays' })
  our_fee: number;
  @Field()
  sat_per_vbyte: number;
  @Field({ nullable: true })
  txid: string | null;
  @Field(() => Int)
  broadcast_height: number;
  @Field(() => Int)
  confirmations: number;
  @Field(() => Int, { description: 'Confirmations at which the splice locks' })
  lock_depth: number;
  @Field()
  we_locked: boolean;
  @Field()
  peer_locked: boolean;
  @Field({ description: 'An input was double spent: it can never confirm' })
  dead: boolean;
  @Field({ nullable: true, description: 'in_mempool, rejected or unknown' })
  relay_status: string | null;
  @Field({ nullable: true })
  relay_reason: string | null;
  @Field({ nullable: true })
  new_channel_point: string | null;
  @Field()
  new_capacity: number;
}

@ObjectType()
export class LastSpliceInfo {
  @Field({ description: 'local, remote, both or unknown' })
  initiator: string;
  @Field()
  local_delta: number;
  @Field()
  remote_delta: number;
  @Field({ nullable: true })
  txid: string | null;
  @Field({ nullable: true, description: 'ISO 8601 time it locked or ended' })
  time: string | null;
  @Field({ description: 'locked, aborted or dead' })
  outcome: string;
  @Field({
    nullable: true,
    description: 'A refusal code, or the peer text when reason_from_peer',
  })
  reason: string | null;
  @Field()
  reason_from_peer: boolean;
}

@ObjectType()
export class SpliceChannelInfo {
  @Field({ description: 'Current short channel id (block x tx x output)' })
  id: string;
  @Field({ description: 'Current funding outpoint, which a splice moves' })
  channel_point: string;
  @Field()
  original_channel_point: string;
  @Field()
  original_id: string;
  @Field()
  partner_public_key: string;
  @Field({ nullable: true })
  peer_alias: string | null;
  @Field()
  is_active: boolean;
  @Field()
  is_private: boolean;
  @Field()
  capacity: number;
  @Field()
  local_balance: number;
  @Field()
  remote_balance: number;
  @Field({
    nullable: true,
    description: 'Upfront shutdown address: splice outs can only go there',
  })
  close_address: string | null;
  @Field()
  unified_sigs: boolean;
  @Field({ description: 'LND splice_status: ok or why a splice cannot start' })
  splice_status: string;
  @Field({ description: 'Whether a splice can start now' })
  can_splice: boolean;
  @Field(() => PendingSpliceInfo, { nullable: true })
  pending_splice: PendingSpliceInfo | null;
  @Field(() => LastSpliceInfo, { nullable: true })
  last_splice: LastSpliceInfo | null;
}

@ObjectType()
export class SpliceStatus {
  @Field({
    description:
      'Whether splicing is on in this node (protocol.splice, feature bit 62/63)',
  })
  node_enabled: boolean;
  @Field(() => [SpliceChannelInfo])
  channels: SpliceChannelInfo[];
}

@InputType()
export class SpliceInput {
  @Field({ description: 'Current or original channel point, txid:index' })
  channel_point: string;
  @Field({ description: 'in (wallet to channel) or out (channel to address)' })
  direction: string;
  @Field({ nullable: true, description: 'Whole sats, ignored with use_max' })
  amount?: number;
  @Field({ nullable: true })
  use_max?: boolean;
  @Field({
    nullable: true,
    description: 'Whole sat/vB; empty or 0 to use target_conf',
  })
  sat_per_vbyte?: number;
  @Field(() => Int, { nullable: true, description: 'Default 6' })
  target_conf?: number;
  @Field({
    nullable: true,
    description: 'For out: destination, empty for a new node wallet address',
  })
  address?: string;
  @Field({
    nullable: true,
    description: 'Accept a fee rate below the node floor (never below relay)',
  })
  force_low_fee?: boolean;
}

@ObjectType()
export class SpliceEstimate {
  @Field({ description: 'Splice transaction fee, all paid by this node' })
  fee: number;
  @Field()
  vbytes: number;
  @Field()
  sat_per_vbyte: number;
  @Field({ description: 'Amount used: the one asked for or the maximum' })
  amount: number;
  @Field()
  min: number;
  @Field()
  max_in: number;
  @Field()
  max_out: number;
  @Field({ description: 'Lowest fee rate accepted without forcing it' })
  min_sat_per_vbyte: number;
  @Field({ description: 'estimate or relay_minimum' })
  fee_estimate_source: string;
  @Field()
  anchor_reserve: number;
  @Field()
  new_capacity: number;
  @Field()
  new_local: number;
  @Field(() => Int)
  lock_depth: number;
  @Field()
  destination_is_ours: boolean;
  @Field({ nullable: true, description: 'Why the splice is not possible' })
  refusal_code: string | null;
}

@ObjectType()
export class SpliceResult {
  @Field({
    description:
      'preparing, negotiating, signed, broadcast, confirmed, locked or aborted',
  })
  state: string;
  @Field({ nullable: true })
  txid: string | null;
  @Field({ nullable: true })
  new_channel_point: string | null;
  @Field(() => Int)
  confirmations: number;
  @Field({ nullable: true, description: 'For aborted: code or peer text' })
  reason: string | null;
  @Field()
  reason_from_peer: boolean;
  @Field({
    description:
      'No signed, broadcast or aborted update arrived in time; the splice may still go on',
  })
  timed_out: boolean;
}
