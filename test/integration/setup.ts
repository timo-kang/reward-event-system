import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { GatewayModule } from '../../src/gateway/gateway.module';
import { AuthModule } from '../../src/auth/auth.module';
import { EventModule } from '../../src/event/event.module';
import { User, UserSchema } from '../../src/auth/schemas/user.schema';
import { Event, EventSchema } from '../../src/event/schemas/event.schema';
import { Reward, RewardSchema } from '../../src/event/schemas/reward.schema';
import { RewardRequest, RewardRequestSchema } from '../../src/event/schemas/reward-request.schema';

let mongod: MongoMemoryServer;
let gatewayApp: INestApplication;
let authApp: INestApplication;
let eventApp: INestApplication;
let authModule: TestingModule;
let eventModule: TestingModule;

export async function setupTestEnvironment() {
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();

  const mongooseModule = MongooseModule.forRoot(mongoUri);

  const jwtConfig = {
    JWT_SECRET: 'jwt-secret-test',
    JWT_EXPIRATION: '1h',
  };

  const configModule = ConfigModule.forRoot({
    isGlobal: true,
    load: [
      () => ({
        MONGO_URI: mongoUri,
        ...jwtConfig,
        AUTH_SERVICE_URL: 'http://localhost:3001',
        EVENT_SERVICE_URL: 'http://localhost:3002',
      }),
    ],
  });

  authModule = await Test.createTestingModule({
    imports: [
      configModule,
      mongooseModule,
      MongooseModule.forFeature([
        { name: User.name, schema: UserSchema },
      ]),
      AuthModule,
    ],
  }).compile();
  authApp = authModule.createNestApplication();
  await authApp.listen(3001);

  eventModule = await Test.createTestingModule({
    imports: [
      configModule,
      mongooseModule,
      MongooseModule.forFeature([
        { name: Event.name, schema: EventSchema },
        { name: Reward.name, schema: RewardSchema },
        { name: RewardRequest.name, schema: RewardRequestSchema },
      ]),
      AuthModule,
      EventModule,
    ],
  }).compile();
  eventApp = eventModule.createNestApplication();
  await eventApp.listen(3002);

  const gatewayModule = await Test.createTestingModule({
    imports: [
      configModule,
      GatewayModule,
    ],
  }).compile();
  gatewayApp = gatewayModule.createNestApplication();
  await gatewayApp.listen(3000);

  return {
    gatewayApp,
    authApp,
    eventApp,
    mongod,
    authModule,
    eventModule,
  };
}

export async function teardownTestEnvironment() {
  await mongoose.disconnect();
  await mongod.stop();
  await gatewayApp.close();
  await authApp.close();
  await eventApp.close();
} 