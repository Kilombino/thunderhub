import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NodeService } from '../../node/node.service';
import { CurrentUser } from '../../security/security.decorators';
import { UserId } from '../../security/security.types';
import { sortBy } from 'lodash';
import {
  ChainAddressSend,
  ChainFeeBump,
  ChainTransaction,
  Utxo,
} from './chain.types';
import {
  WalletUtxo,
  cpfpBudget,
  cpfpChildFeeRate,
  estimateVsize,
  largestWalletOutput,
  transactionVsize,
} from '../coinControl/coinControl.helpers';
import { GraphQLError } from 'graphql';
import { SendToChainAddressOptions } from '../../node/lightning.types';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';

@Resolver()
export class ChainResolver {
  constructor(
    private nodeService: NodeService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @Query(() => [ChainTransaction])
  async getChainTransactions(@CurrentUser() { id }: UserId) {
    const transactionList = await this.nodeService.getChainTransactions(id);

    const transactions = sortBy(
      transactionList.transactions,
      'created_at'
    ).reverse();

    const hasUnconfirmed = transactions.some((t: any) => !t.is_confirmed);
    if (!hasUnconfirmed) return transactions;

    // Unconfirmed transactions with a wallet output can be sped up via CPFP.
    const utxos: WalletUtxo[] =
      (await this.nodeService.getUtxos(id).catch(() => null))?.utxos || [];

    return transactions.map((t: any) => {
      if (t.is_confirmed) return t;
      const output = largestWalletOutput(utxos, t.id);
      return {
        ...t,
        vsize: this.getVsize(t.transaction),
        cpfp_vout: output?.transaction_vout,
        cpfp_tokens: output?.tokens,
      };
    });
  }

  private getVsize(raw?: string): number | undefined {
    if (!raw) return undefined;
    try {
      return transactionVsize(raw);
    } catch {
      return undefined;
    }
  }

  /**
   * Child-pays-for-parent: asks LND's sweeper (WalletKit BumpFee) to spend a
   * wallet output of an unconfirmed transaction with a fee high enough for
   * parent + child to reach `fee_rate`. Funding transactions of channels can
   * not be replaced (RBF) because the channel id commits to their txid.
   */
  @Mutation(() => ChainFeeBump)
  async bumpChainTransactionFee(
    @CurrentUser() { id }: UserId,
    @Args('transaction_id') transactionId: string,
    @Args('fee_rate', { description: 'Target package fee rate in sat/vB' })
    feeRate: number
  ): Promise<ChainFeeBump> {
    const { transactions } = await this.nodeService.getChainTransactions(id);
    const parent = transactions.find((t: any) => t.id === transactionId);

    if (!parent) throw new GraphQLError('Transaction not found in the wallet.');
    if (parent.is_confirmed) {
      throw new GraphQLError('Transaction is already confirmed.');
    }

    const { utxos } = await this.nodeService.getUtxos(id);
    const output = largestWalletOutput<WalletUtxo>(utxos, transactionId);

    if (!output) {
      throw new GraphQLError(
        'This transaction has no output belonging to the wallet, so it can not be sped up with CPFP.'
      );
    }

    const parentVsize = this.getVsize(parent.transaction);
    if (!parentVsize) {
      throw new GraphQLError('Unable to read the raw transaction.');
    }

    const parentFee = parent.is_outgoing ? parent.fee || 0 : 0;
    const { childRate, childFee, packageRate } = cpfpChildFeeRate({
      parentVsize,
      parentFee,
      targetRate: feeRate,
      childVsize: estimateVsize([output.address_format], 1),
    });
    const budget = cpfpBudget(childFee);

    this.logger.info('Requesting CPFP fee bump', {
      transaction_id: transactionId,
      transaction_vout: output.transaction_vout,
      target_fee_rate: feeRate,
      child_fee_rate: childRate,
      budget,
    });

    const lnd = this.nodeService.getAuthenticatedLnd(id);

    const status = await new Promise<string>((resolve, reject) => {
      (lnd as any).wallet.bumpFee(
        {
          outpoint: {
            txid_str: transactionId,
            output_index: output.transaction_vout,
          },
          sat_per_vbyte: String(childRate),
          immediate: true,
          budget: String(budget),
        },
        (err: any, res: any) => {
          if (err) {
            return reject(
              new GraphQLError(
                `Error bumping fee: ${err.details || err.message}`
              )
            );
          }
          return resolve(res?.status || '');
        }
      );
    });

    return {
      transaction_id: transactionId,
      transaction_vout: output.transaction_vout,
      child_fee_rate: childRate,
      child_fee: childFee,
      budget,
      package_fee_rate: packageRate,
      status,
    };
  }

  @Query(() => [Utxo])
  async getUtxos(@CurrentUser() { id }: UserId) {
    const info = await this.nodeService.getUtxos(id);
    return info?.utxos;
  }

  @Mutation(() => String)
  async createAddress(
    @Args('type', { defaultValue: 'p2tr' })
    type: string,
    @CurrentUser() { id }: UserId
  ) {
    const isValidType = ['np2wpkh', 'p2wpkh', 'p2tr'].includes(type);

    this.logger.debug('Creating onchain address', { type });

    const { address } = await this.nodeService.createChainAddress(
      id,
      true,
      (isValidType ? type : 'p2tr') as any
    );

    return address;
  }

  @Mutation(() => ChainAddressSend)
  async sendToAddress(
    @Args('address') address: string,
    @Args('tokens', { nullable: true }) tokens: number,
    @Args('fee', { nullable: true }) fee: number,
    @Args('target', { nullable: true }) target: number,
    @Args('sendAll', { nullable: true }) sendAllFlag: boolean,
    @CurrentUser() { id }: UserId
  ) {
    const props = fee
      ? { fee_tokens_per_vbyte: fee }
      : target
        ? { target_confirmations: target }
        : {};

    const hasTokens = tokens && !sendAllFlag ? { tokens } : {};
    const sendAll = sendAllFlag ? { is_send_all: true } : {};

    const options = {
      address,
      ...hasTokens,
      ...props,
      ...sendAll,
    } as SendToChainAddressOptions;

    const send = await this.nodeService.sendToChainAddress(id, options);

    return {
      confirmationCount: send.confirmation_count,
      id: send.id,
      isConfirmed: send.is_confirmed,
      isOutgoing: send.is_outgoing,
      ...(send.tokens && { tokens: send.tokens }),
    };
  }
}
