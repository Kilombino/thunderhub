import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { AmbossService } from '../api/amboss/amboss.service';
import { EdgeInfo, NodeAlias } from '../api/amboss/amboss.types';
import {
  ChannelMetadataService,
  NoteOwner,
  noteOwnerKey,
} from '../api/channels/channel-metadata.service';

export type ChannelNoteKey = {
  owner: NoteOwner;
  channelId: string;
};

export type DataloaderTypes = {
  nodesLoader: DataLoader<string, NodeAlias>;
  edgesLoader: DataLoader<string, EdgeInfo>;
  channelNotesLoader: DataLoader<ChannelNoteKey, string | null>;
};

@Injectable()
export class DataloaderService {
  constructor(
    private ambossService: AmbossService,
    private channelMetadataService: ChannelMetadataService
  ) {}

  createLoaders(): DataloaderTypes {
    const nodesLoader = new DataLoader<string, NodeAlias>(
      async (pubkeys: string[]) => this.ambossService.getNodeAliasBatch(pubkeys)
    );

    const edgesLoader = new DataLoader<string, EdgeInfo>(
      async (ids: string[]) => this.ambossService.getEdgeInfoBatch(ids)
    );

    const channelNotesLoader = new DataLoader<
      ChannelNoteKey,
      string | null,
      string
    >(
      async (keys: readonly ChannelNoteKey[]) => {
        const grouped = new Map<string, NoteOwner>();
        for (const key of keys) {
          grouped.set(noteOwnerKey(key.owner), key.owner);
        }

        const noteMaps = new Map<string, Map<string, string>>();
        for (const [groupKey, owner] of grouped) {
          noteMaps.set(
            groupKey,
            await this.channelMetadataService.getNotes(owner)
          );
        }

        return keys.map(
          key =>
            noteMaps.get(noteOwnerKey(key.owner))?.get(key.channelId) ?? null
        );
      },
      {
        cacheKeyFn: (key: ChannelNoteKey) =>
          `${noteOwnerKey(key.owner)}:${key.channelId}`,
      }
    );

    return {
      nodesLoader,
      edgesLoader,
      channelNotesLoader,
    };
  }
}
