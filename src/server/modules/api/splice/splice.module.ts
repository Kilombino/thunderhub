import { Module } from '@nestjs/common';
import { NodeModule } from '../../node/node.module';
import { SpliceResolver } from './splice.resolver';
import { SpliceService } from './splice.service';

@Module({
  imports: [NodeModule],
  providers: [SpliceResolver, SpliceService],
})
export class SpliceModule {}
