import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as grpc from '@grpc/grpc-js';
import { fromJSON } from '@grpc/proto-loader';
import { toWithError } from 'src/server/utils/async';
import { NodeService } from '../../node/node.service';
import { spliceDescriptor } from './splice.descriptor';
import {
  buildSpliceRequest,
  isDecisiveUpdate,
  isNodeSpliceEnabled,
  mapSpliceChannel,
  mapSpliceEstimate,
  mapSpliceUpdate,
  RpcChannel,
} from './splice.helpers';
import {
  SpliceEstimate,
  SpliceInput,
  SpliceResult,
  SpliceStatus,
} from './splice.types';

/** Same options the lightning package loads LND's own protos with. */
const protoOptions = {
  defaults: true,
  enums: String,
  keepCase: true,
  longs: String,
  oneofs: true,
};

const UNARY_DEADLINE_MS = 30 * 1000;
/**
 * How long spliceChannel waits for the splice to be agreed (signed) or
 * aborted before answering. The splice goes on after that either way.
 */
const SPLICE_ANSWER_MS = 2 * 60 * 1000;

type SpliceClient = grpc.Client & {
  [method: string]: (...args: any[]) => any;
};

type SpliceClientConstructor = new (
  address: string,
  credentials: grpc.ChannelCredentials,
  options?: grpc.ClientOptions
) => SpliceClient;

let spliceConstructor: SpliceClientConstructor | undefined;

const getSpliceConstructor = (): SpliceClientConstructor => {
  if (!spliceConstructor) {
    const definition = fromJSON(
      spliceDescriptor as Parameters<typeof fromJSON>[0],
      protoOptions
    );
    const rpc = grpc.loadPackageDefinition(definition) as any;
    spliceConstructor = rpc.lnrpc.Lightning;
  }
  return spliceConstructor as SpliceClientConstructor;
};

const asError = (err: grpc.ServiceError): Error => {
  if (err.code === grpc.status.UNIMPLEMENTED) {
    return new Error(
      'This LND node cannot splice (EstimateSplice and SpliceChannel missing)'
    );
  }
  return new Error(err.details || err.message);
};

@Injectable()
export class SpliceService {
  private clients = new WeakMap<object, SpliceClient>();

  constructor(
    private nodeService: NodeService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  /**
   * A second lnrpc.Lightning client, with the splice RPCs and fields, on
   * the gRPC channel (TLS and macaroon) of the account's lightning
   * connection. EstimateSplice needs onchain:read and offchain:read;
   * SpliceChannel onchain:write and offchain:write, as opening and closing.
   */
  private getClient(accountId: string): SpliceClient {
    const lnd = this.nodeService.getAuthenticatedLnd(accountId) as any;
    const cached = this.clients.get(lnd);
    if (cached) return cached;

    const channel = lnd?.default?.getChannel?.();
    if (!channel) {
      throw new Error('No gRPC connection to this node for splicing');
    }

    const Lightning = getSpliceConstructor();
    const client = new Lightning('lnrpc', grpc.credentials.createInsecure(), {
      channelOverride: channel,
    });
    this.clients.set(lnd, client);
    return client;
  }

  private call<T>(
    accountId: string,
    method: string,
    request: object
  ): Promise<T> {
    const client = this.getClient(accountId);
    const deadline = new Date(Date.now() + UNARY_DEADLINE_MS);

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

  async getStatus(accountId: string): Promise<SpliceStatus> {
    const [{ channels = [] }, [info]] = await Promise.all([
      this.call<{ channels?: RpcChannel[] }>(accountId, 'ListChannels', {
        peer_alias_lookup: true,
      }),
      toWithError(this.nodeService.getWalletInfo(accountId)),
    ]);

    const mapped = channels.map(mapSpliceChannel);

    return {
      node_enabled: isNodeSpliceEnabled(
        (info as { features?: { bit: number }[] } | undefined)?.features,
        mapped.map(channel => channel.splice_status)
      ),
      channels: mapped,
    };
  }

  async estimate(
    accountId: string,
    input: SpliceInput
  ): Promise<SpliceEstimate> {
    const request = buildSpliceRequest(input);
    const res = await this.call<any>(accountId, 'EstimateSplice', request);
    return mapSpliceEstimate(res);
  }

  /**
   * Starts the splice and answers with its first decisive update (signed,
   * broadcast or later, or aborted), or with the last one seen when that
   * takes longer than SPLICE_ANSWER_MS. The stream is kept open afterwards:
   * LND cancels a splice whose stream closes before it is signed, and once
   * signed the remaining updates are only logged.
   */
  async splice(accountId: string, input: SpliceInput): Promise<SpliceResult> {
    const request = buildSpliceRequest(input, true);
    const client = this.getClient(accountId);

    const log = {
      channel_point: input.channel_point,
      direction: request.direction,
      amount_sat: request.use_max ? 'max' : request.amount_sat,
      sat_per_vbyte: request.sat_per_vbyte,
      target_conf: request.target_conf,
      to_own_wallet: !request.addr,
      force_low_fee: request.force_low_fee,
    };
    this.logger.info('Starting channel splice', log);

    return new Promise((resolve, reject) => {
      let answered = false;
      let last: SpliceResult | undefined;

      const answer = (result: SpliceResult) => {
        if (answered) return;
        answered = true;
        clearTimeout(timer);
        resolve(result);
      };

      const fail = (error: Error) => {
        if (answered) return;
        answered = true;
        clearTimeout(timer);
        reject(error);
      };

      const timer = setTimeout(() => {
        this.logger.warn('Splice not agreed yet, answering anyway', {
          ...log,
          state: last?.state,
        });
        answer(
          last
            ? { ...last, timed_out: true }
            : mapSpliceUpdate({ state: 'preparing' }, true)
        );
      }, SPLICE_ANSWER_MS);

      const stream = client.SpliceChannel(request);

      stream.on('data', (update: any) => {
        last = mapSpliceUpdate(update);
        this.logger.info('Splice update', {
          channel_point: input.channel_point,
          state: last.state,
          txid: last.txid,
          new_channel_point: last.new_channel_point,
          confirmations: last.confirmations,
          reason: last.reason,
          reason_from_peer: last.reason_from_peer,
        });
        if (isDecisiveUpdate(last.state)) answer(last);
      });

      stream.on('error', (err: grpc.ServiceError) => {
        const error = asError(err);
        this.logger.error('Splice stream error', {
          ...log,
          state: last?.state,
          error: error.message,
        });
        if (last) {
          answer(last);
        } else {
          fail(error);
        }
      });

      stream.on('end', () => {
        this.logger.info('Splice stream ended', {
          channel_point: input.channel_point,
          state: last?.state,
        });
        if (last) {
          answer(last);
        } else {
          fail(new Error('The splice ended without any update'));
        }
      });
    });
  }
}
