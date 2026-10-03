import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { AccountsModule } from '../accounts/accounts.module';

@Global()
@Module({
  imports: [AccountsModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
