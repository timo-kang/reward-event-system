import { Test, TestingModule } from '@nestjs/testing';
import { RewardRequestService, RewardRequestStatus } from './reward-request.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RewardRequest } from './schemas/reward-request.schema';
import { Event } from './schemas/event.schema';
import { Reward } from './schemas/reward.schema';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MockRewardRequestModel, MockEventModel, MockRewardModel, createMockRewardRequest, createMockEvent, createMockReward } from '../test/mock-models';
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { UserActivityService } from '../auth/user-activity.service';
import { RewardService } from './reward.service';

describe('RewardRequestService', () => {
  let service: RewardRequestService;
  let rewardRequestModel: Model<RewardRequest>;
  let eventModel: Model<Event>;
  let rewardModel: Model<Reward>;
  let userActivityService: UserActivityService;
  let rewardService: RewardService;

  const TEST_USER_ID = '507f1f77bcf86cd799439014';
  const TEST_EVENT_ID = '507f1f77bcf86cd799439011';
  const TEST_REWARD_ID = '507f1f77bcf86cd799439012';
  const TEST_REQUEST_ID = '507f1f77bcf86cd799439013';

  const mockRewardRequest = createMockRewardRequest(TEST_REQUEST_ID, TEST_USER_ID, TEST_EVENT_ID, TEST_REWARD_ID);
  const mockEvent = createMockEvent(TEST_EVENT_ID);
  const mockReward = createMockReward(TEST_REWARD_ID, TEST_EVENT_ID);

  const mockUserActivityService = {
    getUserPoints: jest.fn(),
    getUserConsecutiveLogins: jest.fn(),
    getUserInvitedFriendsCount: jest.fn(),
  };

  const mockRewardService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardRequestService,
        {
          provide: getModelToken('RewardRequest'),
          useValue: MockRewardRequestModel,
        },
        {
          provide: getModelToken('Event'),
          useValue: MockEventModel,
        },
        {
          provide: getModelToken('Reward'),
          useValue: MockRewardModel,
        },
        {
          provide: UserActivityService,
          useValue: mockUserActivityService,
        },
        {
          provide: RewardService,
          useValue: mockRewardService,
        },
      ],
    }).compile();

    service = module.get<RewardRequestService>(RewardRequestService);
    rewardRequestModel = module.get<Model<RewardRequest>>(getModelToken('RewardRequest'));
    eventModel = module.get<Model<Event>>(getModelToken('Event'));
    rewardModel = module.get<Model<Reward>>(getModelToken('Reward'));
    userActivityService = module.get<UserActivityService>(UserActivityService);
    rewardService = module.get<RewardService>(RewardService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a reward request successfully', async () => {
      const createRewardRequestDto: CreateRewardRequestDto = {
        eventId: TEST_EVENT_ID,
        rewardId: TEST_REWARD_ID,
        userId: TEST_USER_ID,
      };

      const mockRewardRequest = {
        _id: new Types.ObjectId(TEST_REQUEST_ID),
        ...createRewardRequestDto,
        status: 'PENDING',
        request_date: new Date('2025-05-20T06:15:53.333Z'),
        createdAt: new Date('2025-05-20T06:15:53.333Z'),
        updatedAt: new Date('2025-05-20T06:15:53.333Z'),
      };

      const newRewardRequest = new MockRewardRequestModel(createRewardRequestDto);
      newRewardRequest.save = jest.fn().mockResolvedValue(mockRewardRequest);

      MockEventModel.findById.mockResolvedValue(createMockEvent(TEST_EVENT_ID));
      mockRewardService.findById.mockResolvedValue(createMockReward(TEST_REWARD_ID, TEST_EVENT_ID));
      MockRewardRequestModel.findOne.mockResolvedValue(null);

      const result = await service.create(TEST_EVENT_ID, createRewardRequestDto);

      expect(result).toBeDefined();
      expect(result).toMatchObject({
        _id: mockRewardRequest._id,
        ...createRewardRequestDto,
        status: 'PENDING',
      });
      expect(result.request_date).toBeInstanceOf(Date);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(MockEventModel.findById).toHaveBeenCalledWith(TEST_EVENT_ID);
      expect(mockRewardService.findById).toHaveBeenCalledWith(TEST_REWARD_ID);
      expect(MockRewardRequestModel.findOne).toHaveBeenCalledWith({
        event: TEST_EVENT_ID,
        user: TEST_USER_ID,
        status: 'PENDING',
      });
      expect(newRewardRequest.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when event not found', async () => {
      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(null);

      await expect(service.create(TEST_EVENT_ID, { userId: TEST_USER_ID, eventId: TEST_EVENT_ID, rewardId: TEST_REWARD_ID }))
        .rejects.toThrow(NotFoundException);
      expect(mockRewardService.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when reward not found', async () => {
      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(mockEvent);
      mockRewardService.findById.mockResolvedValue(null);

      await expect(service.create(TEST_EVENT_ID, { userId: TEST_USER_ID, eventId: TEST_EVENT_ID, rewardId: TEST_REWARD_ID }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when event is not active', async () => {
      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue({ ...mockEvent, is_active: false });

      await expect(service.create(TEST_EVENT_ID, { userId: TEST_USER_ID, eventId: TEST_EVENT_ID, rewardId: TEST_REWARD_ID }))
        .rejects.toThrow(ForbiddenException);
      expect(mockRewardService.findById).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when request already exists', async () => {
      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(mockEvent);
      mockRewardService.findById.mockResolvedValue(mockReward);
      MockRewardRequestModel.findOne.mockReturnThis();
      MockRewardRequestModel.exec.mockResolvedValue(mockRewardRequest);

      await expect(service.create(TEST_EVENT_ID, { userId: TEST_USER_ID, eventId: TEST_EVENT_ID, rewardId: TEST_REWARD_ID }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('findByUser', () => {
    it('should return reward requests for a user', async () => {
      const requests = [mockRewardRequest];
      MockRewardRequestModel.exec.mockResolvedValue(requests);

      const result = await service.findByUser(TEST_USER_ID);

      expect(result).toEqual(requests);
      expect(MockRewardRequestModel.find).toHaveBeenCalledWith({ user: TEST_USER_ID });
    });

    it('should return empty array when no requests exist', async () => {
      MockRewardRequestModel.exec.mockResolvedValue([]);

      const result = await service.findByUser(TEST_USER_ID);

      expect(result).toEqual([]);
      expect(MockRewardRequestModel.find).toHaveBeenCalledWith({ user: TEST_USER_ID });
    });

    it('should throw BadRequestException when user id is invalid', async () => {
      await expect(service.findByUser('invalid-id'))
        .rejects.toThrow(BadRequestException);
      expect(MockRewardRequestModel.find).not.toHaveBeenCalled();
    });
  });

  describe('findByEvent', () => {
    it('should return reward requests for an event', async () => {
      const requests = [mockRewardRequest];
      MockRewardRequestModel.exec.mockResolvedValue(requests);

      const result = await service.findByEvent(TEST_EVENT_ID);

      expect(result).toEqual(requests);
      expect(MockRewardRequestModel.find).toHaveBeenCalledWith({ event: TEST_EVENT_ID });
    });

    it('should return empty array when no requests exist', async () => {
      MockRewardRequestModel.exec.mockResolvedValue([]);

      const result = await service.findByEvent(TEST_EVENT_ID);

      expect(result).toEqual([]);
      expect(MockRewardRequestModel.find).toHaveBeenCalledWith({ event: TEST_EVENT_ID });
    });

    it('should throw BadRequestException when event id is invalid', async () => {
      await expect(service.findByEvent('invalid-id'))
        .rejects.toThrow(BadRequestException);
      expect(MockRewardRequestModel.find).not.toHaveBeenCalled();
    });
  });

  describe('findByStatus', () => {
    it('should return reward requests by status', async () => {
      const requests = [mockRewardRequest];
      MockRewardRequestModel.exec.mockResolvedValue(requests);

      const result = await service.findByStatus(RewardRequestStatus.PENDING);

      expect(result).toEqual(requests);
      expect(MockRewardRequestModel.find).toHaveBeenCalledWith({ status: RewardRequestStatus.PENDING });
    });

    it('should return empty array when no requests exist', async () => {
      MockRewardRequestModel.exec.mockResolvedValue([]);

      const result = await service.findByStatus(RewardRequestStatus.PENDING);

      expect(result).toEqual([]);
      expect(MockRewardRequestModel.find).toHaveBeenCalledWith({ status: RewardRequestStatus.PENDING });
    });
  });

  describe('updateStatus', () => {
    it('should update request status successfully', async () => {
      const updatedRequest = { ...mockRewardRequest, status: RewardRequestStatus.APPROVED };
      MockRewardRequestModel.findByIdAndUpdate.mockReturnThis();
      MockRewardRequestModel.exec.mockResolvedValue(updatedRequest);

      const result = await service.updateStatus(TEST_REQUEST_ID, RewardRequestStatus.APPROVED);

      expect(result).toEqual(updatedRequest);
      expect(MockRewardRequestModel.findByIdAndUpdate).toHaveBeenCalledWith(
        TEST_REQUEST_ID,
        { status: RewardRequestStatus.APPROVED },
        { new: true }
      );
    });

    it('should throw NotFoundException when request not found', async () => {
      MockRewardRequestModel.findByIdAndUpdate.mockReturnThis();
      MockRewardRequestModel.exec.mockResolvedValue(null);

      await expect(service.updateStatus('507f1f77bcf86cd799439013', RewardRequestStatus.APPROVED))
        .rejects.toThrow(NotFoundException);
      expect(MockRewardRequestModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw BadRequestException when request id is invalid', async () => {
      await expect(service.updateStatus('invalid-id', RewardRequestStatus.APPROVED))
        .rejects.toThrow(BadRequestException);
      expect(MockRewardRequestModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when status is invalid', async () => {
      await expect(service.updateStatus(TEST_REQUEST_ID, 'INVALID_STATUS' as RewardRequestStatus))
        .rejects.toThrow(BadRequestException);
      expect(MockRewardRequestModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('validateConditions', () => {
    it('should return true when all conditions are met', async () => {
      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(mockEvent);
      mockUserActivityService.getUserPoints.mockResolvedValue(150);
      mockUserActivityService.getUserConsecutiveLogins.mockResolvedValue(5);
      mockUserActivityService.getUserInvitedFriendsCount.mockResolvedValue(3);

      const result = await service['validateConditions'](TEST_EVENT_ID, TEST_USER_ID);

      expect(result).toBe(true);
      expect(mockUserActivityService.getUserPoints).toHaveBeenCalledWith(TEST_USER_ID);
      expect(mockUserActivityService.getUserConsecutiveLogins).toHaveBeenCalledWith(TEST_USER_ID);
      expect(mockUserActivityService.getUserInvitedFriendsCount).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should return false when conditions are not met', async () => {
      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(mockEvent);
      mockUserActivityService.getUserPoints.mockResolvedValue(50);
      mockUserActivityService.getUserConsecutiveLogins.mockResolvedValue(2);
      mockUserActivityService.getUserInvitedFriendsCount.mockResolvedValue(1);

      const result = await service['validateConditions'](TEST_EVENT_ID, TEST_USER_ID);

      expect(result).toBe(false);
      expect(mockUserActivityService.getUserPoints).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should return true when no conditions exist', async () => {
      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue({ ...mockEvent, conditions: [] });

      const result = await service['validateConditions'](TEST_EVENT_ID, TEST_USER_ID);

      expect(result).toBe(true);
      expect(mockUserActivityService.getUserPoints).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when event not found', async () => {
      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(null);

      await expect(service['validateConditions'](TEST_EVENT_ID, TEST_USER_ID))
        .rejects.toThrow(NotFoundException);
      expect(mockUserActivityService.getUserPoints).not.toHaveBeenCalled();
    });
  });
});