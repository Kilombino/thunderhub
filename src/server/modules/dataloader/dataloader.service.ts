import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { NodeService } from '../node/node.service';
import { UserId } from '../security/security.types';
import { toWithError } from 'src/server/utils/async';
import {
  ChannelMetadataService,
  NoteOwner,
  noteOwnerKey,
} from '../api/channels/channel-metadata.service';

export type ChannelNoteKey = {
  owner: NoteOwner;
  channelId: string;
};

export type EdgeKey = { user: UserId; id: string };

export type EdgeInfo = {
  short_channel_id: string;
  info: {
    node1_pub: string;
    node1_info: { node: { alias: string; pub_key: string } };
    node2_pub: string;
    node2_info: { node: { alias: string; pub_key: string } };
  };
};

export type DataloaderTypes = {
  edgesLoader: DataLoader<EdgeKey, EdgeInfo | null, string>;
  channelNotesLoader: DataLoader<ChannelNoteKey, string | null>;
};

@Injectable()
export class DataloaderService {
  constructor(
    private nodeService: NodeService,
    private channelMetadataService: ChannelMetadataService
  ) {}

  createLoaders(): DataloaderTypes {
    // XBT fork: channel and node info come from the user's own LND graph, never from
    // Amboss (which would learn our peers' keys, and only knows the other chain anyway).
    const aliases = new Map<string, Promise<string>>();
    const alias = (user: UserId, pubkey: string) => {
      const key = `${user.id}:${pubkey}`;
      if (!aliases.has(key)) {
        aliases.set(
          key,
          toWithError(this.nodeService.getNode(user.id, pubkey, true)).then(
            ([node]) => (node as any)?.alias || ''
          )
        );
      }
      return aliases.get(key) as Promise<string>;
    };

    const edgesLoader = new DataLoader<EdgeKey, EdgeInfo | null, string>(
      async (keys: readonly EdgeKey[]) =>
        Promise.all(
          keys.map(async ({ user, id }) => {
            const [channel] = await toWithError(
              this.nodeService.getChannel(user.id, id)
            );
            const [p1, p2] = ((channel as any)?.policies || []).map(
              (p: { public_key: string }) => p.public_key
            );
            if (!p1 || !p2) return null;
            const [a1, a2] = await Promise.all([
              alias(user, p1),
              alias(user, p2),
            ]);
            return {
              short_channel_id: id,
              info: {
                node1_pub: p1,
                node1_info: { node: { alias: a1, pub_key: p1 } },
                node2_pub: p2,
                node2_info: { node: { alias: a2, pub_key: p2 } },
              },
            };
          })
        ),
      { cacheKeyFn: (key: EdgeKey) => `${key.user.id}:${key.id}` }
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
      edgesLoader,
      channelNotesLoader,
    };
  }
}
