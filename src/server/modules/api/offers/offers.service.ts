import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as grpc from '@grpc/grpc-js';
import { fromJSON } from '@grpc/proto-loader';
import { and, desc, eq } from 'drizzle-orm';
import { NodeService } from '../../node/node.service';
import { DRIZZLE, DrizzleProvider } from '../../database/drizzle.provider';
import { offersDescriptor } from './offers.descriptor';
import {
  isBolt12Offer,
  mapDecodedBolt12,
  mapDecodedInvoice,
  mapPayOfferResult,
  normalizeBolt12,
  preimageMatches,
  satsToMsat,
} from './offers.helpers';
import { Bolt12Receipt, DecodedBolt12, PayOfferResult } from './offers.types';

/** What is kept of a BOLT 12 payment to make its receipt again. */
type ReceiptRow = {
  payment_hash: string;
  payment_preimage: string;
  offer: string;
  invoice: string;
  payer_note: string | null;
  amount_msat: string;
  fee_msat: string;
  paid_at: string;
};

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
    @Inject(DRIZZLE) private readonly drizzle: DrizzleProvider,
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

    // The receipt: LND keeps no invoice for a payment to an offer, so what
    // proves it is kept here. A failure to keep it doesn't undo the payment.
    const row: ReceiptRow = {
      payment_hash: result.payment_hash,
      payment_preimage: result.payment_preimage,
      offer,
      invoice: result.bolt12,
      payer_note: request.payer_note || null,
      amount_msat: result.amount_msat,
      fee_msat: result.fee_msat,
      paid_at: new Date().toISOString(),
    };
    const saved = await this.saveReceipt(accountId, row).catch(err => {
      this.logger.error('Could not keep the BOLT 12 receipt', { err });
      return false;
    });
    result.receipt = await this.buildReceipt(accountId, row, saved).catch(
      () => null
    );

    return result;
  }

  private async nodePublicKey(accountId: string): Promise<string> {
    const info = (await this.nodeService.getWalletInfo(accountId)) as any;
    return info.public_key;
  }

  private async saveReceipt(
    accountId: string,
    row: ReceiptRow
  ): Promise<boolean> {
    if (!this.drizzle) return false;
    const { db, schema } = this.drizzle as any;
    const node_public_key = await this.nodePublicKey(accountId);
    await db
      .insert(schema.bolt12Receipts)
      .values({ node_public_key, ...row })
      .onConflictDoNothing();
    return true;
  }

  /**
   * Makes the receipt from what was kept: the invoice and the offer decoded
   * again (so the invoice signature is checked now) and the preimage checked
   * against the invoice's payment hash.
   */
  private async buildReceipt(
    accountId: string,
    row: ReceiptRow,
    saved: boolean
  ): Promise<Bolt12Receipt> {
    const inv = mapDecodedInvoice(
      await this.call<any>(
        accountId,
        'DecodeBolt12',
        { bolt12: row.invoice },
        DECODE_DEADLINE_MS
      )
    );
    const offer = await this.decode(accountId, row.offer).catch(() => null);
    const hash = inv?.payment_hash || row.payment_hash;

    return {
      payment_hash: row.payment_hash,
      payment_preimage: row.payment_preimage,
      preimage_matches:
        hash === row.payment_hash &&
        preimageMatches(row.payment_preimage, row.payment_hash),
      offer: row.offer,
      offer_id: offer?.offer?.offer_id || null,
      description: offer?.offer?.description || null,
      issuer: offer?.offer?.issuer || null,
      invoice: row.invoice,
      invoice_signature_valid: !!inv?.signature_valid,
      invoice_node_id: inv?.node_id || null,
      payer_id: inv?.payer_id || null,
      payer_note: row.payer_note,
      amount_msat: row.amount_msat,
      fee_msat: row.fee_msat,
      paid_at: row.paid_at,
      chains: inv?.chains || [],
      saved,
    };
  }

  /** A kept receipt, checked again; null when there is none. */
  async receipt(
    accountId: string,
    paymentHash: string
  ): Promise<Bolt12Receipt | null> {
    if (!this.drizzle) return null;
    const { db, schema } = this.drizzle as any;
    const table = schema.bolt12Receipts;
    const node_public_key = await this.nodePublicKey(accountId);
    const rows = await db
      .select()
      .from(table)
      .where(
        and(
          eq(table.node_public_key, node_public_key),
          eq(table.payment_hash, paymentHash)
        )
      )
      .limit(1);
    if (!rows.length) return null;
    return this.buildReceipt(accountId, rows[0], true);
  }

  /** The payment hashes this node has a receipt for, newest first. */
  async receiptHashes(accountId: string): Promise<string[]> {
    if (!this.drizzle) return [];
    const { db, schema } = this.drizzle as any;
    const table = schema.bolt12Receipts;
    const node_public_key = await this.nodePublicKey(accountId);
    const rows = await db
      .select({ payment_hash: table.payment_hash })
      .from(table)
      .where(eq(table.node_public_key, node_public_key))
      .orderBy(desc(table.paid_at));
    return rows.map((r: { payment_hash: string }) => r.payment_hash);
  }
}
