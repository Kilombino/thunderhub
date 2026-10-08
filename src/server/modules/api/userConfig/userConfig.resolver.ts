import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Args,
  Mutation,
  Query,
  registerEnumType,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserConfigService } from './userConfig.service';
import { ConfigFields, ConfigState } from './userConfig.types';

registerEnumType(ConfigFields, { name: 'ConfigFields' });

@Resolver(ConfigState)
export class UserConfigStateResolver {
  constructor(
    private userConfigService: UserConfigService,
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @ResolveField()
  backup_state() {
    // XBT fork: auto backups were pushed to Amboss, which is gone.
    return false;
  }

  @ResolveField()
  healthcheck_ping_state() {
    // XBT fork: these fed Amboss (health pings, balance pushes), which is gone.
    return false;
  }

  @ResolveField()
  onchain_push_enabled() {
    // XBT fork: these fed Amboss (health pings, balance pushes), which is gone.
    return false;
  }

  @ResolveField()
  channels_push_enabled() {
    // XBT fork: these fed Amboss (health pings, balance pushes), which is gone.
    return false;
  }

  @ResolveField()
  private_channels_push_enabled() {
    // XBT fork: these fed Amboss (health pings, balance pushes), which is gone.
    return false;
  }
}

@Resolver()
export class UserConfigResolver {
  constructor(
    private userConfigService: UserConfigService,
    private configService: ConfigService
  ) {}

  @Query(() => ConfigState)
  async getConfigState() {
    return {};
  }

  @Mutation(() => Boolean)
  async toggleConfig(
    @Args('field', { type: () => ConfigFields }) field: ConfigFields
  ) {
    // XBT fork: every toggle here fed Amboss (backups, health pings, balance pushes).
    throw new Error(`${field} is not available on this chain.`);
  }
}
