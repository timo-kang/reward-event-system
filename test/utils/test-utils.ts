import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { GatewayModule } from '../../src/gateway/gateway.module';

export async function createTestingApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [GatewayModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  await app.init();
  return app;
}

export function createMockHttpService() {
  return {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
}

export function createMockConfigService() {
  return {
    get: jest.fn(),
  };
}

export function createMockJwtService() {
  return {
    sign: jest.fn(),
    verify: jest.fn(),
  };
}

export function createMockUserService() {
  return {
    findByUsername: jest.fn(),
    create: jest.fn(),
    validateUser: jest.fn(),
  };
}

export function createMockEventService() {
  return {
    createEvent: jest.fn(),
    findAllEvents: jest.fn(),
    findEventById: jest.fn(),
    updateEventStatus: jest.fn(),
  };
}

export function createMockRewardService() {
  return {
    create: jest.fn(),
    findByEvent: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    linkRewardToEvent: jest.fn(),
  };
}

export function createMockRewardRequestService() {
  return {
    create: jest.fn(),
    findByUser: jest.fn(),
    findByEvent: jest.fn(),
    updateStatus: jest.fn(),
  };
} 