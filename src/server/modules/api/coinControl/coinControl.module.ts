import { Module } from '@nestjs/common';
import { NodeModule } from '../../node/node.module';
import { CoinControlResolver } from './coinControl.resolver';
import { CoinControlService } from './coinControl.service';

@Module({
  imports: [NodeModule],
  providers: [CoinControlResolver, CoinControlService],
})
export class CoinControlModule {}
