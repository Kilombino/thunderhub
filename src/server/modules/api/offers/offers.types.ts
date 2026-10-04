import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Bolt12Offer {
  @Field()
  offer_id: string;
  @Field({ nullable: true })
  description: string | null;
  @Field({ nullable: true, description: 'Who is being paid (offer_issuer)' })
  issuer: string | null;
  @Field({ description: 'Requested amount in millisats, 0 for any amount' })
  amount_msat: string;
  @Field({ nullable: true, description: 'ISO 8601 expiry, null for never' })
  absolute_expiry: string | null;
  @Field({ nullable: true })
  issuer_id: string | null;
  @Field(() => Int)
  num_paths: number;
  @Field({ description: 'Largest quantity a request may ask for, 0 for none' })
  quantity_max: number;
  @Field()
  quantity_any: boolean;
}

@ObjectType()
export class DecodedBolt12 {
  @Field({ description: 'offer, invoice_request or invoice' })
  type: string;
  @Field()
  for_this_chain: boolean;
  @Field(() => [String])
  chains: string[];
  @Field()
  valid: boolean;
  @Field({ nullable: true })
  validation_error: string | null;
  @Field({ description: 'Whether this node minted the offer' })
  ours: boolean;
  @Field(() => Bolt12Offer, { nullable: true })
  offer: Bolt12Offer | null;
}

@ObjectType()
export class PayOfferResult {
  @Field({ description: 'The paid BOLT 12 invoice (lni1...)' })
  bolt12: string;
  @Field()
  payment_hash: string;
  @Field()
  payment_preimage: string;
  @Field()
  amount_msat: string;
  @Field()
  fee_msat: string;
}
