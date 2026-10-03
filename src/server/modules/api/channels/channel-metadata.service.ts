import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleProvider } from '../../database/drizzle.provider';
import { ChannelMetadata } from './channel-metadata.types';

/**
 * Who a channel note belongs to:
 * - `user`: a database user and one of their database nodes.
 * - `account`: a config-file (or SSO) account, identified by the public key
 *   of its node so notes survive macaroon or name changes.
 */
export type NoteOwner =
  | { kind: 'user'; userId: string; nodeId: string }
  | { kind: 'account'; nodePublicKey: string };

export const noteOwnerKey = (owner: NoteOwner): string =>
  owner.kind === 'user'
    ? `user:${owner.userId}:${owner.nodeId}`
    : `account:${owner.nodePublicKey}`;

const NO_DATABASE_ERROR =
  'Channel notes require a database. Set DB_TYPE and DB_SQLITE_PATH (or DB_POSTGRES_URL) in your environment and make sure the database location is writable.';

@Injectable()
export class ChannelMetadataService {
  constructor(@Inject(DRIZZLE) private readonly drizzle: DrizzleProvider) {}

  isEnabled(): boolean {
    return this.drizzle !== null;
  }

  private getTarget(owner: NoteOwner) {
    if (!this.drizzle) throw new Error(NO_DATABASE_ERROR);
    const { db, schema } = this.drizzle;

    if (owner.kind === 'user') {
      const table = schema.channelMetadata;
      return {
        db: db as any,
        table,
        where: and(
          eq(table.user_id, owner.userId),
          eq(table.node_id, owner.nodeId)
        ),
        values: { user_id: owner.userId, node_id: owner.nodeId },
        conflictTarget: [table.user_id, table.node_id, table.channel_id],
      };
    }

    const table = schema.accountChannelNotes;
    return {
      db: db as any,
      table,
      where: eq(table.node_public_key, owner.nodePublicKey),
      values: { node_public_key: owner.nodePublicKey },
      conflictTarget: [table.node_public_key, table.channel_id],
    };
  }

  async getNotes(owner: NoteOwner): Promise<Map<string, string>> {
    if (!this.drizzle) return new Map();
    const { db, table, where } = this.getTarget(owner);
    const rows = await db
      .select({ channel_id: table.channel_id, note: table.note })
      .from(table)
      .where(where);
    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.channel_id, row.note);
    }
    return map;
  }

  async upsertNote(
    owner: NoteOwner,
    channelId: string,
    note: string
  ): Promise<ChannelMetadata> {
    const { db, table, values, conflictTarget } = this.getTarget(owner);
    const now = new Date().toISOString();
    await db
      .insert(table)
      .values({ ...values, channel_id: channelId, note, updated_at: now })
      .onConflictDoUpdate({
        target: conflictTarget,
        set: { note, updated_at: now },
      });
    return { channel_id: channelId, note, updated_at: now };
  }

  async deleteNote(owner: NoteOwner, channelId: string): Promise<boolean> {
    const { db, table, where } = this.getTarget(owner);
    await db.delete(table).where(and(where, eq(table.channel_id, channelId)));
    return true;
  }
}
