import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType()
export class CoinControlOutpointInput {
  @Field()
  transaction_id: string;
  @Field(() => Int)
  transaction_vout: number;
}

@InputType()
export class PrepareCoinControlChannelInput {
  @Field({ description: 'Peer public key, optionally as pubkey@host:port' })
  partner_public_key: string;
  @Field({ description: 'Channel capacity in sats' })
  channel_size: number;
  @Field({ description: 'On-chain fee rate in sat/vB (decimals allowed)' })
  fee_rate: number;
  @Field(() => [CoinControlOutpointInput])
  outpoints: CoinControlOutpointInput[];
  @Field({ nullable: true })
  is_private?: boolean;
  @Field({ nullable: true })
  base_fee_mtokens?: string;
  @Field({ nullable: true, description: 'Routing fee rate in ppm' })
  routing_fee_rate?: number;
}

@ObjectType()
export class CoinControlInput {
  @Field()
  transaction_id: string;
  @Field(() => Int)
  transaction_vout: number;
  @Field()
  tokens: number;
}

@ObjectType()
export class CoinControlChannelProposal {
  @Field()
  pending_channel_id: string;
  @Field()
  partner_public_key: string;
  @Field()
  funding_address: string;
  @Field()
  expires_at: string;
  @Field(() => [CoinControlInput])
  inputs: CoinControlInput[];
  @Field()
  input_total: number;
  @Field()
  channel_amount: number;
  @Field()
  change: number;
  @Field()
  fee: number;
  @Field()
  estimated_vsize: number;
  @Field()
  estimated_fee_rate: number;
  @Field()
  requested_fee_rate: number;
  @Field()
  sat_per_kw: number;
}

@ObjectType()
export class CoinControlChannelResult {
  @Field()
  transaction_id: string;
  @Field()
  fee: number;
  @Field()
  vsize: number;
  @Field()
  fee_rate: number;
}
