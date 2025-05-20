// Test comment
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { EventController } from './event.controller';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { SharedAuthModule } from "../shared/auth/shared-auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    SharedAuthModule,
  ],
  controllers: [AuthController, EventController, GatewayController],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}