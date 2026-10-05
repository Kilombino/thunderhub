import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { NodeService } from '../../node/node.service';
import { CurrentUser } from '../../security/security.decorators';
import { UserId } from '../../security/security.types';
import {
  CreateInvoice,
  PayInvoice,
  PaymentFeeEstimate,
} from './invoices.types';
import { randomBytes, createHash } from 'crypto';
import { toWithError } from '../../../utils/async';
import {
  FeeEstimateChannel,
  isOutgoingCandidate,
  mapWithConcurrency,
  sortFeeEstimates,
  spendableBalance,
  toFeeEstimate,
} from './invoices.helpers';

const KEYSEND_TYPE = '5482373484';
const MESSAGE_TYPE = '34349334';
/** Route queries in flight at once when estimating fees per channel. */
const FEE_ESTIMATE_CONCURRENCY = 4;

@Resolver()
export class InvoicesResolver {
  constructor(
    private nodeService: NodeService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @Query(() => String)
  async getInvoiceStatusChange(
    @CurrentUser() user: UserId,
    @Args('id') id: string
  ) {
    const sub = this.nodeService.subscribeToInvoice(user.id, id);

    return Promise.race([
      new Promise(resolve => {
        sub.on('invoice_updated', (data: any) => {
          if (data.is_confirmed) {
            resolve(true);
          }
        });
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 90000)
      ),
    ])
      .then((res: any) => {
        if (res) {
          return 'paid';
        }
        return 'not_paid';
      })
      .catch(e => {
        if (e) return 'timeout';
      });
  }

  /**
   * Estimates the routing fee of paying a BOLT 11 invoice out of each active
   * channel, without paying: one QueryRoutes per channel, restricted to that
   * outgoing channel, with the invoice's amount, final CLTV delta and route
   * hints. Channels that cannot send the amount are not queried.
   */
  @Query(() => [PaymentFeeEstimate])
  async estimatePaymentFees(
    @CurrentUser() user: UserId,
    @Args('request') request: string
  ): Promise<PaymentFeeEstimate[]> {
    const decoded = await this.nodeService.decodePaymentRequest(
      user.id,
      request.trim()
    );

    const mtokens: string = decoded?.mtokens || '0';
    if (BigInt(mtokens) <= BigInt(0)) {
      throw new GraphQLError(
        'This invoice has no amount, so there is nothing to estimate'
      );
    }
    const tokens = Number(decoded.tokens || 0);

    const { channels } = await this.nodeService.getChannels(user.id, {
      is_active: true,
    });
    const candidates = (channels as FeeEstimateChannel[]).filter(
      isOutgoingCandidate
    );

    const rows = await mapWithConcurrency(
      candidates,
      FEE_ESTIMATE_CONCURRENCY,
      async channel => {
        if (spendableBalance(channel) < tokens) {
          return {
            channel: channel.id,
            partner_public_key: channel.partner_public_key,
            local_balance: channel.local_balance,
            error: 'insufficient_balance',
          };
        }

        const [result, error] = await toWithError(
          this.nodeService.getRouteToDestination(user.id, {
            destination: decoded.destination,
            mtokens,
            cltv_delta: decoded.cltv_delta,
            outgoing_channel: channel.id,
            ...(decoded.routes?.length && { routes: decoded.routes }),
          })
        );

        if (error) {
          this.logger.debug('Fee estimate failed for channel', {
            channel: channel.id,
            error: error.message,
          });
        }

        return toFeeEstimate(channel, result, error);
      }
    );

    return sortFeeEstimates(rows);
  }

  @Mutation(() => CreateInvoice)
  async createInvoice(
    @CurrentUser() user: UserId,
    @Args('amount') amount: number,
    @Args('description', { nullable: true }) description: string,
    @Args('secondsUntil', { nullable: true }) secondsUntil: number,
    @Args('includePrivate', { nullable: true }) includePrivate: boolean
  ) {
    const getDate = (secondsUntil: number) => {
      const date = new Date();
      date.setSeconds(date.getSeconds() + secondsUntil);

      return date.toISOString();
    };

    const invoiceParams = {
      tokens: amount,
      ...(description && { description }),
      ...(!!secondsUntil && { expires_at: getDate(secondsUntil) }),
      ...(includePrivate && { is_including_private_channels: true }),
    };

    this.logger.info('Creating invoice with params', invoiceParams);

    return await this.nodeService.createInvoice(user.id, invoiceParams);
  }

  @Mutation(() => PayInvoice)
  async keysend(
    @CurrentUser() user: UserId,
    @Args('tokens') tokens: number,
    @Args('destination', { nullable: true }) destination: string,
    @Args('message', { nullable: true }) message: string
  ) {
    const preimage = randomBytes(32);
    const secret = preimage.toString('hex');
    const id = createHash('sha256').update(preimage).digest().toString('hex');

    const messages = [
      {
        type: KEYSEND_TYPE,
        value: secret,
      },
      ...(message
        ? [{ type: MESSAGE_TYPE, value: Buffer.from(message).toString('hex') }]
        : []),
    ];

    return await this.nodeService.payViaPaymentDetails(user.id, {
      id,
      tokens,
      destination,
      messages,
    });
  }

  @Mutation(() => Boolean)
  async pay(
    @CurrentUser() user: UserId,
    @Args('max_fee') max_fee: number,
    @Args('max_paths') max_paths: number,
    @Args('request') request: string,
    @Args('out', { nullable: true, type: () => [String] })
    outgoing_channels: string[]
  ) {
    const props = {
      max_fee,
      max_paths,
      request,
      outgoing_channels,
    };

    this.logger.debug('Paying invoice with params', props);

    try {
      const response = await this.nodeService.pay(user.id, props);
      this.logger.debug('Paid invoice', response);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'InsufficientBalanceToAttemptPayment') {
        throw new GraphQLError(
          'Payment failed: could not find a funded route. Check for inactive channels or stuck HTLCs.'
        );
      }
      throw err;
    }
  }
}
