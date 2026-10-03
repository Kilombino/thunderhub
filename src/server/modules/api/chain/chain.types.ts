import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Utxo {
  @Field()
  address: string;
  @Field()
  address_format: string;
  @Field()
  confirmation_count: number;
  @Field()
  output_script: string;
  @Field()
  tokens: number;
  @Field()
  transaction_id: string;
  @Field()
  transaction_vout: number;
}

@ObjectType()
export class ChainTransaction {
  @Field({ nullable: true })
  block_id?: string;
  @Field({ nullable: true })
  confirmation_count?: number;
  @Field({ nullable: true })
  confirmation_height?: number;
  @Field()
  created_at: string;
  @Field({ nullable: true })
  description?: string;
  @Field({ nullable: true })
  fee?: number;
  @Field()
  id: string;
  @Field()
  is_confirmed: boolean;
  @Field()
  is_outgoing: boolean;
  @Field(() => [String])
  output_addresses: string[];
  @Field()
  tokens: number;
  @Field({ nullable: true })
  transaction?: string;
  @Field({ nullable: true, description: 'Virtual size of the transaction' })
  vsize?: number;
  @Field(() => Int, {
    nullable: true,
    description:
      'Unconfirmed only: index of the largest wallet-owned output, spendable by a CPFP child',
  })
  cpfp_vout?: number;
  @Field({ nullable: true })
  cpfp_tokens?: number;
}

@ObjectType()
export class ChainFeeBump {
  @Field()
  transaction_id: string;
  @Field(() => Int)
  transaction_vout: number;
  @Field({ description: 'Fee rate requested for the child (sat/vB)' })
  child_fee_rate: number;
  @Field({ description: 'Estimated child fee in sats' })
  child_fee: number;
  @Field({ description: 'Maximum fee LND may spend on the child (sats)' })
  budget: number;
  @Field({ description: 'Estimated parent + child fee rate (sat/vB)' })
  package_fee_rate: number;
  @Field()
  status: string;
}

@ObjectType()
export class ChainAddressSend {
  @Field()
  confirmationCount: number;
  @Field()
  id: string;
  @Field()
  isConfirmed: boolean;
  @Field()
  isOutgoing: boolean;
  @Field({ nullable: true })
  tokens: number;
}
