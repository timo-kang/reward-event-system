import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestEnvironment, teardownTestEnvironment } from './setup';
import { CreateUserDto } from '../../src/auth/dto/create-user.dto';
import { CreateEventDto } from '../../src/event/dto/create-event.dto';
import { CreateRewardDto } from '../../src/event/dto/create-reward.dto';
import { CreateRewardRequestDto } from '../../src/event/dto/create-reward-request.dto';
import { UserRole } from '../../src/shared/auth';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../src/auth/schemas/user.schema';
import { AuthService } from '../../src/auth/auth.service';

describe('System Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let userId: string;
  let eventId: string;
  let rewardId: string;
  let userModel: any;
  let authService: AuthService;

  beforeAll(async () => {
    const { gatewayApp, authModule } = await setupTestEnvironment();
    app = gatewayApp;
    userModel = authModule.get(getModelToken(User.name));
    authService = authModule.get(AuthService);

    // Create admin user and get token before any tests
    const adminUser = await authService.register({
      username: 'adminUser',
      password: 'adminpass123',
    });

    // Update role to admin
    await userModel.findByIdAndUpdate(adminUser.user.id, { role: UserRole.ADMIN });

    // Login to get admin token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'adminUser',
        password: 'adminpass123',
      })
      .expect(200);

    adminToken = loginResponse.body.access_token;
    console.log('Admin token created:', adminToken);

    // Verify admin role in token
    const verifyResponse = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    console.log('Admin role verified:', verifyResponse.body.role);
    expect(verifyResponse.body.role).toBe(UserRole.ADMIN);
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

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      userId = response.body.user.id;
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
      authToken = response.body.access_token;
    });
  });

  describe('Event Management Flow', () => {
    it('should create a new event (admin only)', async () => {
      console.log('Using admin token for event creation:', adminToken);
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Event Description',
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        conditions: [
          {
            type: 'minimumPoints',
            value: 100
          },
          {
            type: 'consecutiveLogins',
            value: 5
          },
          {
            type: 'invitedFriends',
            value: 3
          }
        ],
        is_active: true, // Set event as active
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createEventDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      eventId = response.body._id;
      console.log('Created event ID:', eventId);

      // Verify event was created and is active
      const eventResponse = await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200);

      console.log('Event details:', eventResponse.body);
      expect(eventResponse.body.is_active).toBe(true);
    });

    it('should get all events (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should create a reward for the event (admin only)', async () => {
      const createRewardDto: CreateRewardDto = {
        name: 'Test Reward',
        description: 'Test Reward Description',
        type: 'POINTS',
        value: 100,
        event: eventId,
      };

      console.log('Creating reward for event:', eventId);
      const response = await request(app.getHttpServer())
        .post(`/events/${eventId}/rewards`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRewardDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      rewardId = response.body._id;

      // Verify reward was created
      const rewardResponse = await request(app.getHttpServer())
        .get(`/events/${eventId}/rewards`)
        .expect(200);

      console.log('Rewards for event:', rewardResponse.body);
      expect(Array.isArray(rewardResponse.body)).toBe(true);
      expect(rewardResponse.body.length).toBeGreaterThan(0);
      expect(rewardResponse.body[0]._id).toBe(rewardId);
    });

    it('should get rewards by event (public)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${eventId}/rewards`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Reward Request Flow', () => {
    beforeAll(async () => {
      // Create test event
      const createEventDto: CreateEventDto = {
        name: 'Test Event for Reward Request',
        description: 'Test Event Description for Reward Request',
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        conditions: [
          {
            type: 'minimumPoints',
            value: 100
          }
        ],
        is_active: true,
      };

      const eventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createEventDto)
        .expect(201);

      eventId = eventResponse.body._id;
      console.log('Created test event ID:', eventId);

      // Create test reward
      const createRewardDto: CreateRewardDto = {
        name: 'Test Reward for Request',
        description: 'Test Reward Description for Request',
        type: 'POINTS',
        value: 100,
        event: eventId,
      };

      const rewardResponse = await request(app.getHttpServer())
        .post(`/events/${eventId}/rewards`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRewardDto)
        .expect(201);

      rewardId = rewardResponse.body._id;
      console.log('Created test reward ID:', rewardId);

      // Verify reward was created
      const verifyResponse = await request(app.getHttpServer())
        .get(`/events/${eventId}/rewards`)
        .expect(200);

      console.log('Rewards for event:', verifyResponse.body);
      expect(Array.isArray(verifyResponse.body)).toBe(true);
      expect(verifyResponse.body.length).toBeGreaterThan(0);
      expect(verifyResponse.body[0]._id).toBe(rewardId);
    });

    it('should create a reward request (authenticated user)', async () => {
      const createRewardRequestDto: CreateRewardRequestDto = {
        rewardId: rewardId,
        userId: userId,
        eventId: eventId,
      };

      const response = await request(app.getHttpServer())
        .post(`/events/${eventId}/reward-requests`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRewardRequestDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.status).toBe('PENDING');
    });

    it('should get reward requests by event (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${eventId}/requests`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const requestId = response.body[0]._id;

      it('should update reward request status (admin only)', async () => {
        const updateResponse = await request(app.getHttpServer())
          .put(`/events/${eventId}/requests/${requestId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'APPROVED' })
          .expect(200);

        expect(updateResponse.body.status).toBe('APPROVED');
      });
    });
  });
});