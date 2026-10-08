import { Module } from '@nestjs/common';
import { DataloaderService } from './dataloader.service';
import { NodeModule } from '../node/node.module';
import { ChannelMetadataService } from '../api/channels/channel-metadata.service';

@Module({
  imports: [NodeModule],
  providers: [DataloaderService, ChannelMetadataService],
  exports: [DataloaderService],
})
export class DataloaderModule {}
