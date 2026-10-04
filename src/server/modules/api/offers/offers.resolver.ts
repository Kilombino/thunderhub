import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../security/security.decorators';
import { UserId } from '../../security/security.types';
import { OffersService } from './offers.service';
import { DecodedBolt12, PayOfferResult } from './offers.types';

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
