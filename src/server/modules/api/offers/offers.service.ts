import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as grpc from '@grpc/grpc-js';
import { fromJSON } from '@grpc/proto-loader';
import { NodeService } from '../../node/node.service';
import { offersDescriptor } from './offers.descriptor';
import {
  isBolt12Offer,
  mapDecodedBolt12,
  mapPayOfferResult,
  normalizeBolt12,
  satsToMsat,
} from './offers.helpers';
import { DecodedBolt12, PayOfferResult } from './offers.types';

/** Same options the lightning package loads LND's own protos with. */
const protoOptions = {
  defaults: true,
  enums: String,
  keepCase: true,
  longs: String,
  oneofs: true,
};

const DECODE_DEADLINE_MS = 15 * 1000;
/** PayOffer waits for the invoice and then for the payment. */
const PAY_DEADLINE_MS = 5 * 60 * 1000;
const MSAT_PER_SAT = 1000;

type OffersClient = grpc.Client & {
  [method: string]: (...args: any[]) => grpc.ClientUnaryCall;
};

type OffersClientConstructor = new (
  address: string,
  credentials: grpc.ChannelCredentials,
  options?: grpc.ClientOptions
) => OffersClient;

let offersConstructor: OffersClientConstructor | undefined;

const getOffersConstructor = (): OffersClientConstructor => {
  if (!offersConstructor) {
    const definition = fromJSON(
      offersDescriptor as Parameters<typeof fromJSON>[0],
      protoOptions
    );
    const rpc = grpc.loadPackageDefinition(definition) as any;
    offersConstructor = rpc.offersrpc.Offers;
  }
  return offersConstructor as OffersClientConstructor;
};

const asError = (err: grpc.ServiceError): Error => {
  if (err.code === grpc.status.UNIMPLEMENTED) {
    return new Error(
      'This LND node does not serve BOLT 12 offers (offersrpc sub-server missing)'
    );
  }
  return new Error(err.details || err.message);
};

@Injectable()
export class OffersService {
  private clients = new WeakMap<object, OffersClient>();

  constructor(
    private nodeService: NodeService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  /**
   * The offersrpc client shares the gRPC channel (TLS and macaroon) of the
   * account's lightning connection, so it uses the same macaroon ThunderHub
   * already has. DecodeBolt12 needs invoices:read and PayOffer offchain:write.
   */
  private getClient(accountId: string): OffersClient {
    const lnd = this.nodeService.getAuthenticatedLnd(accountId) as any;
    const cached = this.clients.get(lnd);
    if (cached) return cached;

    const channel = lnd?.default?.getChannel?.();
    if (!channel) {
      throw new Error('No gRPC connection to this node for BOLT 12 offers');
    }

    const Offers = getOffersConstructor();
    const client = new Offers('offersrpc', grpc.credentials.createInsecure(), {
      channelOverride: channel,
    });
    this.clients.set(lnd, client);
    return client;
  }

  private call<T>(
    accountId: string,
    method: string,
    request: object,
    deadlineMs: number
  ): Promise<T> {
    const client = this.getClient(accountId);
    const deadline = new Date(Date.now() + deadlineMs);

    return new Promise((resolve, reject) => {
      client[method](
        request,
        { deadline },
        (err: grpc.ServiceError | null, res: T) => {
          if (err) return reject(asError(err));
          return resolve(res);
        }
      );
    });
  }

  async decode(accountId: string, bolt12: string): Promise<DecodedBolt12> {
    const res = await this.call<any>(
      accountId,
      'DecodeBolt12',
      { bolt12: normalizeBolt12(bolt12) },
      DECODE_DEADLINE_MS
    );
    return mapDecodedBolt12(res);
  }

  async pay(
    accountId: string,
    options: {
      offer: string;
      tokens?: number | null;
      quantity?: number | null;
      payer_note?: string | null;
      max_fee?: number | null;
      max_paths?: number | null;
    }
  ): Promise<PayOfferResult> {
    if (!isBolt12Offer(options.offer)) {
      throw new Error('Expected a BOLT 12 offer (lno1...)');
    }

    const offer = normalizeBolt12(options.offer);
    const request = {
      offer,
      amount_msat: satsToMsat(options.tokens),
      quantity: String(options.quantity || 0),
      payer_note: options.payer_note || '',
      fee_limit_msat: options.max_fee
        ? String(Math.floor(options.max_fee * MSAT_PER_SAT))
        : '0',
      max_parts: options.max_paths || 0,
    };

    this.logger.info('Paying BOLT 12 offer', {
      amount_msat: request.amount_msat,
      quantity: request.quantity,
      fee_limit_msat: request.fee_limit_msat,
      max_parts: request.max_parts,
    });

    const res = await this.call<any>(
      accountId,
      'PayOffer',
      request,
      PAY_DEADLINE_MS
    );
    const result = mapPayOfferResult(res);

    this.logger.info('Paid BOLT 12 offer', {
      payment_hash: result.payment_hash,
      amount_msat: result.amount_msat,
      fee_msat: result.fee_msat,
    });

    return result;
  }
}
