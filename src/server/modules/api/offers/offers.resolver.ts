import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../security/security.decorators';
import { UserId } from '../../security/security.types';
import { OffersService } from './offers.service';
import { Bolt12Receipt, DecodedBolt12, PayOfferResult } from './offers.types';

@Resolver()
export class OffersResolver {
  constructor(private offersService: OffersService) {}

  @Query(() => DecodedBolt12)
  async decodeBolt12(
    @CurrentUser() { id }: UserId,
    @Args('bolt12') bolt12: string
  ): Promise<DecodedBolt12> {
    return this.offersService.decode(id, bolt12);
  }

  @Query(() => Bolt12Receipt, {
    nullable: true,
    description: 'The kept proof of a BOLT 12 payment made from ThunderHub',
  })
  async getBolt12Receipt(
    @CurrentUser() { id }: UserId,
    @Args('payment_hash') payment_hash: string
  ): Promise<Bolt12Receipt | null> {
    return this.offersService.receipt(id, payment_hash);
  }

  @Query(() => [String], {
    description: 'Payment hashes of the BOLT 12 payments with a receipt',
  })
  async getBolt12ReceiptHashes(
    @CurrentUser() { id }: UserId
  ): Promise<string[]> {
    return this.offersService.receiptHashes(id);
  }

  @Mutation(() => PayOfferResult)
  async payOffer(
    @CurrentUser() { id }: UserId,
    @Args('offer') offer: string,
    @Args('tokens', {
      nullable: true,
      description: 'Amount in sats, required when the offer sets none',
    })
    tokens: number,
    @Args('quantity', { nullable: true }) quantity: number,
    @Args('payer_note', { nullable: true }) payer_note: string,
    @Args('max_fee', { nullable: true, description: 'Max routing fee in sats' })
    max_fee: number,
    @Args('max_paths', { nullable: true }) max_paths: number
  ): Promise<PayOfferResult> {
    return this.offersService.pay(id, {
      offer,
      tokens,
      quantity,
      payer_note,
      max_fee,
      max_paths,
    });
  }
}
