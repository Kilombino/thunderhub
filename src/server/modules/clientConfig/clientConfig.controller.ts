import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../security/security.decorators';
import { ClientConfig } from '../../config/configuration';
import { UserService } from '../user/user.service';

@Controller('api')
@Public()
@SkipThrottle()
export class ClientConfigController {
  constructor(
    private configService: ConfigService,
    private userService: UserService
  ) {}

  @Get('config')
  async getConfig(): Promise<ClientConfig & { needsSetup: boolean }> {
    const clientConfig = this.configService.get<ClientConfig>('clientConfig');

    const needsSetup = await this.userService.needsSetup();

    // Reflect whether the database actually opened (it may be disabled at
    // runtime, e.g. on a read-only volume) rather than only DB_TYPE.
    const dbEnabled = this.userService.isDbEnabled();

    return { ...clientConfig, dbEnabled, needsSetup };
  }
}
