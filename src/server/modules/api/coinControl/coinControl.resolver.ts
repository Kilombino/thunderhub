import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../security/security.decorators';
import { UserId } from '../../security/security.types';
import { CoinControlService } from './coinControl.service';
import {
  CoinControlChannelProposal,
  CoinControlChannelResult,
  PrepareCoinControlChannelInput,
} from './coinControl.types';

@Resolver()
export class CoinControlResolver {
  constructor(private coinControlService: CoinControlService) {}

  @Mutation(() => CoinControlChannelProposal)
  async prepareCoinControlChannel(
    @CurrentUser() { id }: UserId,
    @Args('input') input: PrepareCoinControlChannelInput
  ): Promise<CoinControlChannelProposal> {
    return this.coinControlService.prepare(id, input);
  }

  @Mutation(() => CoinControlChannelResult)
  async confirmCoinControlChannel(
    @CurrentUser() { id }: UserId,
    @Args('pending_channel_id') pendingChannelId: string
  ): Promise<CoinControlChannelResult> {
    return this.coinControlService.confirm(id, pendingChannelId);
  }

  @Mutation(() => Boolean)
  async cancelCoinControlChannel(
    @CurrentUser() { id }: UserId,
    @Args('pending_channel_id') pendingChannelId: string
  ): Promise<boolean> {
    return this.coinControlService.cancel(id, pendingChannelId);
  }
}
