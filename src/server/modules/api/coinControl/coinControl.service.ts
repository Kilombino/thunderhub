import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  AuthenticatedLnd,
  cancelPendingChannel,
  fundPendingChannels,
  getUtxos,
  openChannels,
  signPsbt,
  unlockUtxo,
} from 'lightning';
import { NodeService } from '../../node/node.service';
import { to } from '../../node/lnd/lnd.helpers';
import { toWithError } from '../../../utils/async';
import {
  Outpoint,
  PsbtSummary,
  WalletUtxo,
  asOutpoint,
  feeRateToSatPerKw,
  selectUtxos,
  summarizeFundedPsbt,
  transactionIdFromHex,
  transactionVsize,
} from './coinControl.helpers';
import {
  CoinControlChannelProposal,
  CoinControlChannelResult,
  PrepareCoinControlChannelInput,
} from './coinControl.types';

/** LND drops a pending PSBT channel after 10 minutes; stay below that. */
const SESSION_TTL_MS = 9 * 60 * 1000;
const CHANGE_TYPE_P2TR = 'CHANGE_ADDRESS_TYPE_P2TR';
const isPublicKey = (n: string) => /^0[23][0-9a-f]{64}$/i.test(n);

type UtxoLock = Outpoint & { id: string };

type Session = {
  accountId: string;
  pendingChannelId: string;
  lnd: AuthenticatedLnd;
  psbt?: string;
  locks: UtxoLock[];
  summary?: PsbtSummary;
  timer?: NodeJS.Timeout;
};

@Injectable()
export class CoinControlService implements OnModuleDestroy {
  private sessions = new Map<string, Session>();

  constructor(
    private nodeService: NodeService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async onModuleDestroy() {
    for (const session of this.sessions.values()) {
      await this.release(session);
    }
    this.sessions.clear();
  }

  /**
   * Starts a PSBT channel open and funds it with exactly the selected UTXOs.
   * Nothing is signed or broadcast until `confirm` is called.
   */
  async prepare(
    accountId: string,
    input: PrepareCoinControlChannelInput
  ): Promise<CoinControlChannelProposal> {
    const { outpoints, fee_rate, channel_size } = input;
    const satPerKw = feeRateToSatPerKw(fee_rate);

    const [publicKey, socket] = input.partner_public_key.trim().split('@');
    if (!isPublicKey(publicKey)) {
      throw new Error('Invalid peer public key');
    }

    const lnd = this.nodeService.getAuthenticatedLnd(accountId);

    if (socket) {
      await this.nodeService.addPeer(accountId, publicKey, socket, false);
    }

    const { utxos } = await to<{ utxos: WalletUtxo[] }>(getUtxos({ lnd }));
    const { selected } = selectUtxos(utxos, outpoints, channel_size);

    this.logger.info('Starting coin control channel open', {
      partner: publicKey,
      channel_size,
      fee_rate,
      sat_per_kw: satPerKw,
      inputs: selected.map(asOutpoint),
    });

    const { pending } = await to(
      openChannels({
        lnd,
        channels: [
          {
            capacity: channel_size,
            partner_public_key: publicKey,
            is_private: !!input.is_private,
            ...(input.base_fee_mtokens
              ? { base_fee_mtokens: input.base_fee_mtokens }
              : {}),
            ...(input.routing_fee_rate != null
              ? { fee_rate: input.routing_fee_rate }
              : {}),
          },
        ],
      })
    );

    const [channel] = pending;
    const session: Session = {
      accountId,
      pendingChannelId: channel.id,
      lnd,
      locks: [],
    };

    try {
      const funded = await this.fundPsbt(lnd, {
        address: channel.address,
        tokens: channel.tokens,
        inputs: selected,
        satPerKw,
        spendUnconfirmed: selected.some(u => !u.confirmation_count),
      });
      session.locks = funded.locks;
      session.psbt = funded.psbt;

      const summary = summarizeFundedPsbt({
        psbt: funded.psbt,
        changeIndex: funded.changeIndex,
        utxos: selected,
      });
      session.summary = summary;

      // LND must not have added or dropped coins, nor changed the amount.
      const expected = selected.map(asOutpoint).sort().join();
      const actual = summary.inputs.map(asOutpoint).sort().join();
      if (expected !== actual) {
        throw new Error('Funded transaction does not use the selected UTXOs');
      }
      if (summary.channel_amount !== channel.tokens) {
        throw new Error('Funded transaction has an unexpected channel amount');
      }
    } catch (error) {
      await this.release(session);
      throw error;
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    session.timer = setTimeout(() => {
      this.logger.warn('Coin control channel expired, cancelling', {
        pending_channel_id: session.pendingChannelId,
      });
      this.cancel(accountId, session.pendingChannelId).catch(() => null);
    }, SESSION_TTL_MS);
    session.timer.unref?.();

    this.sessions.set(channel.id, session);

    const { summary } = session as Required<Session>;

    return {
      pending_channel_id: channel.id,
      partner_public_key: publicKey,
      funding_address: channel.address,
      expires_at: expiresAt.toISOString(),
      inputs: summary.inputs,
      input_total: summary.input_total,
      channel_amount: summary.channel_amount,
      change: summary.change,
      fee: summary.fee,
      estimated_vsize: summary.estimated_vsize,
      estimated_fee_rate: summary.estimated_fee_rate,
      requested_fee_rate: fee_rate,
      sat_per_kw: satPerKw,
    };
  }

  /** Signs the reviewed PSBT and hands it to LND, which broadcasts it. */
  async confirm(
    accountId: string,
    pendingChannelId: string
  ): Promise<CoinControlChannelResult> {
    const session = this.take(accountId, pendingChannelId);
    const { lnd, psbt, summary } = session;

    try {
      if (!psbt || !summary) throw new Error('Channel was not funded');

      const signed = await to<{ psbt: string; transaction: string }>(
        signPsbt({ lnd, psbt })
      );

      await to(
        fundPendingChannels({
          lnd,
          channels: [pendingChannelId],
          funding: signed.psbt,
        })
      );

      const vsize = transactionVsize(signed.transaction);
      const transaction_id = transactionIdFromHex(signed.transaction);

      this.logger.info('Coin control channel funded', {
        transaction_id,
        fee: summary.fee,
        vsize,
      });

      return {
        transaction_id,
        fee: summary.fee,
        vsize,
        fee_rate: Math.round((summary.fee / vsize) * 1000) / 1000,
      };
    } catch (error) {
      this.logger.error('Error funding coin control channel', { error });
      await this.release(session);
      throw error;
    }
  }

  async cancel(accountId: string, pendingChannelId: string): Promise<boolean> {
    const session = this.take(accountId, pendingChannelId);
    await this.release(session);
    return true;
  }

  private take(accountId: string, pendingChannelId: string): Session {
    const session = this.sessions.get(pendingChannelId);
    if (!session || session.accountId !== accountId) {
      throw new Error('Pending channel not found or already expired');
    }
    this.sessions.delete(pendingChannelId);
    if (session.timer) clearTimeout(session.timer);
    return session;
  }

  /** Cancels the pending channel and releases every leased UTXO. */
  private async release(session: Session) {
    const { lnd, pendingChannelId } = session;

    const [, cancelError] = await toWithError(
      cancelPendingChannel({ lnd, id: pendingChannelId })
    );
    if (cancelError) {
      this.logger.warn('Unable to cancel pending channel', {
        pending_channel_id: pendingChannelId,
        error: cancelError,
      });
    }

    for (const lock of session.locks) {
      const [, unlockError] = await toWithError(unlockUtxo({ lnd, ...lock }));
      if (unlockError) {
        this.logger.warn('Unable to release UTXO lease', {
          outpoint: asOutpoint(lock),
          error: unlockError,
        });
      }
    }
  }

  /**
   * WalletKit FundPsbt with an explicit input list (no coin selection) and a
   * fee rate in sat/kw, which unlike sat/vB allows rates below 1 sat/vB.
   * The `lightning` fundPsbt helper only accepts whole sat/vB.
   */
  private fundPsbt(
    lnd: AuthenticatedLnd,
    args: {
      address: string;
      tokens: number;
      inputs: Outpoint[];
      satPerKw: number;
      spendUnconfirmed: boolean;
    }
  ): Promise<{ psbt: string; changeIndex: number; locks: UtxoLock[] }> {
    return new Promise((resolve, reject) => {
      (lnd as any).wallet.fundPsbt(
        {
          raw: {
            inputs: args.inputs.map(i => ({
              output_index: i.transaction_vout,
              txid_bytes: Buffer.from(i.transaction_id, 'hex').reverse(),
            })),
            outputs: { [args.address]: String(args.tokens) },
          },
          sat_per_kw: String(args.satPerKw),
          change_type: CHANGE_TYPE_P2TR,
          min_confs: 0,
          spend_unconfirmed: args.spendUnconfirmed,
        },
        (err: any, res: any) => {
          if (err) {
            return reject(
              new Error(`Error funding PSBT: ${err.details || err.message}`)
            );
          }
          if (!res?.funded_psbt) {
            return reject(new Error('Expected a funded PSBT from LND'));
          }

          const locks: UtxoLock[] = (res.locked_utxos || []).map(
            (lock: any) => ({
              id: Buffer.from(lock.id).toString('hex'),
              transaction_id: Buffer.from(lock.outpoint.txid_bytes)
                .reverse()
                .toString('hex'),
              transaction_vout: lock.outpoint.output_index,
            })
          );

          return resolve({
            psbt: Buffer.from(res.funded_psbt).toString('hex'),
            changeIndex: Number(res.change_output_index),
            locks,
          });
        }
      );
    });
  }
}
