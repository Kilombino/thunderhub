import { Injectable } from '@nestjs/common';
import { NodeService } from '../../node/node.service';
import { AuthType, UserId } from '../../security/security.types';
import { NoteOwner } from './channel-metadata.service';

@Injectable()
export class NoteOwnerService {
  // Config-file account hash -> node public key (stable for the process).
  private publicKeys = new Map<string, string>();

  constructor(private nodeService: NodeService) {}

  async getOwner(user: UserId): Promise<NoteOwner> {
    if (user.authType === AuthType.USER) {
      return { kind: 'user', userId: user.userId ?? user.id, nodeId: user.id };
    }

    let nodePublicKey = this.publicKeys.get(user.id);
    if (!nodePublicKey) {
      const info = await this.nodeService.getWalletInfo(user.id);
      nodePublicKey = info?.public_key;
      if (!nodePublicKey) {
        throw new Error('Unable to identify the node for channel notes');
      }
      this.publicKeys.set(user.id, nodePublicKey);
    }

    return { kind: 'account', nodePublicKey };
  }
}
