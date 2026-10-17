import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../security/security.decorators';
import { UserId } from '../../security/security.types';
import { SpliceService } from './splice.service';
import {
  SpliceEstimate,
  SpliceInput,
  SpliceResult,
  SpliceStatus,
} from './splice.types';

// Same guards as openChannel and closeChannel: any signed-in user of the
// account, nothing more.
@Resolver()
export class SpliceResolver {
  constructor(private spliceService: SpliceService) {}

  @Query(() => SpliceStatus)
  async getSpliceStatus(@CurrentUser() { id }: UserId): Promise<SpliceStatus> {
    return this.spliceService.getStatus(id);
  }

  @Query(() => SpliceEstimate)
  async estimateSplice(
    @CurrentUser() { id }: UserId,
    @Args('input') input: SpliceInput
  ): Promise<SpliceEstimate> {
    return this.spliceService.estimate(id, input);
  }

  @Mutation(() => SpliceResult)
  async spliceChannel(
    @CurrentUser() { id }: UserId,
    @Args('input') input: SpliceInput
  ): Promise<SpliceResult> {
    return this.spliceService.splice(id, input);
  }
}
