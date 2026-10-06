import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  AuthenticatedLnd,
  cancelPendingChannel,
  createChainAddress,
  lockUtxo,
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
  autoSelectUtxos,
  feeRateToSatPerKw,
  planFunding,
  selectUtxos,
  summarizeFundedPsbt,
  transactionIdFromHex,
  transactionVsize,
} from './coinControl.helpers';
import { Psbt, address as btcAddress } from 'bitcoinjs-lib';
import {
  CoinControlChannelProposal,
  CoinControlChannelResult,
  PrepareCoinControlChannelInput,
} from './coinControl.types';

/** LND drops a pending PSBT channel after 10 minutes; stay below that. */
const SESSION_TTL_MS = 9 * 60 * 1000;
/**
 * The output script of a segwit address (P2WSH funding, P2TR change), built
 * from the bech32 data so no elliptic-curve library is needed for P2TR.
 */
const segwitScript = (addr: string): Buffer => {
  const { version, data } = btcAddress.fromBech32(addr);
  return Buffer.concat([
    Buffer.from([version === 0 ? 0x00 : 0x50 + version, data.length]),
    data,
  ]);
};
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

    const { utxos } = await to<{
      utxos: (WalletUtxo & { output_script: string })[];
    }>(getUtxos({ lnd }));
    // No coins ticked: pick them automatically, still at the exact fee rate.
    const { selected } = outpoints.length
      ? selectUtxos(utxos, outpoints, channel_size)
      : autoSelectUtxos(utxos, channel_size, fee_rate);

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
      const funded = await this.buildPsbt(lnd, {
        address: channel.address,
        tokens: channel.tokens,
        inputs: selected as (WalletUtxo & { output_script: string })[],
        feeRate: fee_rate,
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
      // LND drops the pending channel when the peer disconnects mid-open (common
      // over Tor). Nothing was signed into the chain: say so plainly.
      if (
        /no channel reservation found|no funding intent found/i.test(
          String(error)
        )
      ) {
        throw new Error(
          'El nodo remoto se desconectó durante la apertura y el canal pendiente se canceló. ' +
            'No se ha gastado nada y las monedas quedan libres: vuelve a intentarlo.'
        );
      }
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
   * Builds the funding PSBT here: exactly the chosen coins, the channel output,
   * change to a fresh P2TR address and the fee for the requested rate. LND's
   * FundPsbt would raise any rate below 253 sat/kw to that floor (1.012
   * sat/vB); LND only signs this one (FinalizePsbt). The coins are leased so
   * nothing else spends them while the user reviews.
   */
  private async buildPsbt(
    lnd: AuthenticatedLnd,
    args: {
      address: string;
      tokens: number;
      inputs: (WalletUtxo & { output_script: string })[];
      feeRate: number;
    }
  ): Promise<{ psbt: string; changeIndex: number; locks: UtxoLock[] }> {
    const plan = planFunding(args.inputs, args.tokens, args.feeRate);

    const locks: UtxoLock[] = [];
    try {
      for (const input of args.inputs) {
        const { id } = await to<{ id: string }>(
          lockUtxo({
            lnd,
            transaction_id: input.transaction_id,
            transaction_vout: input.transaction_vout,
          })
        );
        locks.push({
          id,
          transaction_id: input.transaction_id,
          transaction_vout: input.transaction_vout,
        });
      }

      const packet = new Psbt();
      for (const input of args.inputs) {
        packet.addInput({
          hash: input.transaction_id,
          index: input.transaction_vout,
          witnessUtxo: {
            script: Buffer.from(input.output_script, 'hex'),
            value: input.tokens,
          },
        });
      }

      const outputs: { address: string; value: number; change: boolean }[] = [
        { address: args.address, value: args.tokens, change: false },
      ];
      if (plan.change > 0) {
        const { address } = await to<{ address: string }>(
          createChainAddress({ lnd, format: 'p2tr' })
        );
        outputs.push({ address, value: plan.change, change: true });
      }
      // Random output order, so the change is not always in the same place.
      if (outputs.length === 2 && Math.random() < 0.5) outputs.reverse();
      outputs.forEach(o =>
        packet.addOutput({ script: segwitScript(o.address), value: o.value })
      );

      return {
        psbt: packet.toHex(),
        changeIndex: outputs.findIndex(o => o.change),
        locks,
      };
    } catch (error) {
      for (const lock of locks) {
        await toWithError(unlockUtxo({ lnd, ...lock }));
      }
      throw error;
    }
  }
}
