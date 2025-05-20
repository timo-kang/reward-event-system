import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestEnvironment, teardownTestEnvironment } from './setup';
import { CreateUserDto } from '../../src/auth/dto/create-user.dto';
import { CreateEventDto } from '../../src/event/dto/create-event.dto';
import { CreateRewardDto } from '../../src/event/dto/create-reward.dto';
import { CreateRewardRequestDto } from '../../src/event/dto/create-reward-request.dto';

describe('System Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let eventId: string;
  let rewardId: string;

  beforeAll(async () => {
    const { gatewayApp } = await setupTestEnvironment();
    app = gatewayApp;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'testpass123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('message');

      userId = response.body.user.user.id;
    });

    it('should login user and get JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      authToken = response.body.user.access_token;
    });
  });

  describe('Event Management Flow', () => {
    it('should create a new event', async () => {
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Event Description',
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        conditions: {
          min_age: 18,
          max_age: 65,
          required_points: 100,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createEventDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      eventId = response.body._id;
    });

    it('should create a reward for the event', async () => {
      const createRewardDto: CreateRewardDto = {
        event: eventId,
        name: 'Test Reward',
        description: 'Test Reward Description',
        type: "test",
        value: 100
      };

      const response = await request(app.getHttpServer())
        .post('/rewards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRewardDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      rewardId = response.body._id;
    });
  });

  describe('Reward Request Flow', () => {
    it('should create a reward request', async () => {
      const createRewardRequestDto: CreateRewardRequestDto = {
        rewardId: rewardId,
        userId: userId,
        eventId: eventId
      };

      const response = await request(app.getHttpServer())
        .post('/reward-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRewardRequestDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.status).toBe('pending');
    });

    it('should get user reward requests', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reward-requests/user/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
}); 