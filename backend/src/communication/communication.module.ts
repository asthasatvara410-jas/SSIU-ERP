import { Module } from '@nestjs/common';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [CommunicationController, RegisterController, PushController],
  providers: [CommunicationService, RegisterService, PushService],
  exports: [CommunicationService, RegisterService, PushService],
})
export class CommunicationModule {}

