import { Module } from '@nestjs/common';
import { NodeModule } from '../../node/node.module';
import { OffersResolver } from './offers.resolver';
import { OffersService } from './offers.service';

@Module({
  imports: [NodeModule],
  providers: [OffersResolver, OffersService],
})
export class OffersModule {}
