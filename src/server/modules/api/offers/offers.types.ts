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

/**
 * Proof of a BOLT 12 payment. The invoice is signed by the node being paid
 * and commits to the offer and to the payment hash; the preimage hashes to
 * that payment hash and is only released when the payment arrives. Together
 * they show this node paid that invoice for that offer.
 */
@ObjectType()
export class Bolt12Receipt {
  @Field()
  payment_hash: string;
  @Field()
  payment_preimage: string;
  @Field({ description: 'SHA-256 of the preimage is the invoice payment hash' })
  preimage_matches: boolean;
  @Field({ description: 'The offer paid (lno1...)' })
  offer: string;
  @Field({ nullable: true })
  offer_id: string | null;
  @Field({ nullable: true })
  description: string | null;
  @Field({ nullable: true })
  issuer: string | null;
  @Field({ description: 'The invoice the payee signed (lni1...)' })
  invoice: string;
  @Field({ description: 'Whether the invoice signature checks out' })
  invoice_signature_valid: boolean;
  @Field({ nullable: true, description: 'The node that signed the invoice' })
  invoice_node_id: string | null;
  @Field({ nullable: true, description: 'This node payer key in the request' })
  payer_id: string | null;
  @Field({ nullable: true })
  payer_note: string | null;
  @Field()
  amount_msat: string;
  @Field()
  fee_msat: string;
  @Field()
  paid_at: string;
  @Field(() => [String])
  chains: string[];
  @Field({ description: 'Kept in the database, to see again later' })
  saved: boolean;
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
  @Field(() => Bolt12Receipt, { nullable: true })
  receipt: Bolt12Receipt | null;
}
