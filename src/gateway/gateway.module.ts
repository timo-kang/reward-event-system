// Test comment
import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy'; // Keep this import
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ secret: 'YOUR_SECRET_KEY', signOptions: { expiresIn: '60s' } }),
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [GatewayController],
  providers: [GatewayService, JwtStrategy, RolesGuard],
})
export class GatewayModule {}