import { Module } from '@nestjs/common';
import { NodeModule } from '../../node/node.module';
import { ChannelResolver } from './channel.resolver';
import {
  ChannelsResolver,
  UserMutationRoot,
  UserMutationsResolver,
  OffchainMutationsResolver,
  ChannelsMutationsResolver,
} from './channels.resolver';
import { ChannelMetadataService } from './channel-metadata.service';
import { NoteOwnerService } from './note-owner.service';
import { FetchModule } from '../../fetch/fetch.module';
import { TapdModule } from '../../node/tapd/tapd.module';

@Module({
  imports: [NodeModule, FetchModule, TapdModule],
  providers: [
    ChannelsResolver,
    ChannelResolver,
    ChannelMetadataService,
    NoteOwnerService,
    UserMutationRoot,
    UserMutationsResolver,
    OffchainMutationsResolver,
    ChannelsMutationsResolver,
  ],
})
export class ChannelsModule {}
