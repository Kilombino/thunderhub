import { Query, Resolver } from '@nestjs/graphql';
import { FetchService } from '../../fetch/fetch.service';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { BitcoinFee } from './bitcoin.types';
import { ConfigService } from '@nestjs/config';

@Resolver()
export class BitcoinResolver {
  constructor(
    private configService: ConfigService,
    private fetchService: FetchService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @Query(() => String)
  async getBitcoinPrice() {
    try {
      const response = await this.fetchService.fetchWithProxy(
        this.configService.get('urls.ticker')
      );
      const json = (await response.json()) as any;

      // Neoxa quotes against USDC, taken as USD. The client expects blockchain.info's shape.
      const last = json?.ticker?.lastPrice;
      if (typeof last !== 'number' || !(last > 0)) {
        throw new Error('No BTCB2 price in the ticker');
      }
      return JSON.stringify({ USD: { last, symbol: '$' } });
    } catch (error: any) {
      this.logger.error('Error getting bitcoin price', { error });
      throw new Error('Problem getting Bitcoin price.');
    }
  }

  @Query(() => BitcoinFee)
  async getBitcoinFees() {
    try {
      const response = await this.fetchService.fetchWithProxy(
        this.configService.get('urls.fees')
      );
      const json = (await response.json()) as any;

      if (json) {
        const { fastestFee, halfHourFee, hourFee, minimumFee } = json;
        return {
          fast: fastestFee,
          halfHour: halfHourFee,
          hour: hourFee,
          minimum: minimumFee,
        };
      }
      throw new Error('Problem getting Bitcoin fees.');
    } catch (error: any) {
      this.logger.error('Error getting bitcoin fees', { error });
      throw new Error('Problem getting Bitcoin fees.');
    }
  }
}
