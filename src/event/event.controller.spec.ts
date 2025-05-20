import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { RewardService } from './reward.service';
import { RewardRequestService, RewardRequestStatus } from './reward-request.service';
import { Types } from 'mongoose';
import { EventCondition } from './schemas/event.schema';
import { RewardType } from './schemas/reward.schema';

describe('EventController', () => {
  let controller: EventController;
  let eventService: EventService;
  let rewardService: RewardService;
  let rewardRequestService: RewardRequestService;

  const TEST_EVENT_ID = '507f1f77bcf86cd799439011';
  const TEST_REWARD_ID = '507f1f77bcf86cd799439012';
  const TEST_USER_ID = '507f1f77bcf86cd799439013';

  const mockEvent = {
    _id: new Types.ObjectId(TEST_EVENT_ID),
    name: 'Test Event',
    description: 'Test Description',
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    is_active: true,
    conditions: [
      {
        type: 'minimumPoints',
        value: 100,
        description: 'Minimum points required'
      }
    ] as EventCondition[],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockReward = {
    _id: new Types.ObjectId(TEST_REWARD_ID),
    name: 'Test Reward',
    description: 'Test Reward Description',
    type: RewardType.POINTS,
    value: 100,
    event: new Types.ObjectId(TEST_EVENT_ID),
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRewardRequest = {
    _id: new Types.ObjectId(),
    user: new Types.ObjectId(TEST_USER_ID),
    event: new Types.ObjectId(TEST_EVENT_ID),
    reward: new Types.ObjectId(TEST_REWARD_ID),
    status: RewardRequestStatus.PENDING,
    request_date: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockEventService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findActiveEvents: jest.fn(),
    updateEventStatus: jest.fn(),
  };

  const mockRewardService = {
    create: jest.fn(),
    findByEvent: jest.fn(),
  };

  const mockRewardRequestService = {
    create: jest.fn(),
    findByEvent: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: mockEventService,
        },
        {
          provide: RewardService,
          useValue: mockRewardService,
        },
        {
          provide: RewardRequestService,
          useValue: mockRewardRequestService,
        },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    eventService = module.get<EventService>(EventService);
    rewardService = module.get<RewardService>(RewardService);
    rewardRequestService = module.get<RewardRequestService>(RewardRequestService);
  });

  describe('createEvent', () => {
    const createEventDto = {
      name: 'Test Event',
      description: 'Test Description',
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      conditions: [
        {
          type: 'minimumPoints',
          value: 100,
          description: 'Minimum points required'
        }
      ] as EventCondition[],
    };

    it('should create an event', async () => {
      mockEventService.create.mockResolvedValue(mockEvent);

      const result = await controller.createEvent(createEventDto);

      expect(result).toEqual(mockEvent);
      expect(eventService.create).toHaveBeenCalledWith(createEventDto);
    });
  });

  describe('getAllEvents', () => {
    it('should return all events', async () => {
      const events = [mockEvent];
      mockEventService.findAll.mockResolvedValue(events);

      const result = await controller.getAllEvents();

      expect(result).toEqual(events);
      expect(eventService.findAll).toHaveBeenCalled();
    });
  });

  describe('createReward', () => {
    const createRewardDto = {
      name: 'Test Reward',
      description: 'Test Reward Description',
      type: RewardType.POINTS,
      value: 100,
      event: TEST_EVENT_ID,
    };

    it('should create a reward for an event', async () => {
      mockEventService.findById.mockResolvedValue(mockEvent);
      mockRewardService.create.mockResolvedValue(mockReward);

      const result = await controller.createReward(TEST_EVENT_ID, createRewardDto);

      expect(result).toEqual(mockReward);
      expect(eventService.findById).toHaveBeenCalledWith(TEST_EVENT_ID);
      expect(rewardService.create).toHaveBeenCalledWith(TEST_EVENT_ID, createRewardDto);
    });
  });

  describe('getRewardsByEvent', () => {
    it('should return rewards for an event', async () => {
      mockEventService.findById.mockResolvedValue(mockEvent);
      const rewards = [mockReward];
      mockRewardService.findByEvent.mockResolvedValue(rewards);

      const result = await controller.getRewardsByEvent(TEST_EVENT_ID);

      expect(result).toEqual(rewards);
      expect(eventService.findById).toHaveBeenCalledWith(TEST_EVENT_ID);
      expect(rewardService.findByEvent).toHaveBeenCalledWith(TEST_EVENT_ID);
    });
  });

  describe('createRewardRequest', () => {
    const createRewardRequestDto = {
      userId: TEST_USER_ID,
      eventId: TEST_EVENT_ID,
      rewardId: TEST_REWARD_ID,
    };

    it('should create a reward request', async () => {
      mockEventService.findById.mockResolvedValue(mockEvent);
      mockRewardRequestService.create.mockResolvedValue(mockRewardRequest);

      const result = await controller.createRewardRequest(TEST_EVENT_ID, createRewardRequestDto);

      expect(result).toEqual(mockRewardRequest);
      expect(eventService.findById).toHaveBeenCalledWith(TEST_EVENT_ID);
      expect(rewardRequestService.create).toHaveBeenCalledWith(TEST_EVENT_ID, createRewardRequestDto);
    });
  });

  describe('findRewardRequestsByEvent', () => {
    it('should return reward requests for an event', async () => {
      const requests = [mockRewardRequest];
      mockRewardRequestService.findByEvent.mockResolvedValue(requests);

      const result = await controller.findRewardRequestsByEvent(TEST_EVENT_ID);

      expect(result).toEqual(requests);
      expect(rewardRequestService.findByEvent).toHaveBeenCalledWith(TEST_EVENT_ID);
    });
  });

  describe('updateRewardRequestStatus', () => {
    it('should update reward request status', async () => {
      mockEventService.findById.mockResolvedValue(mockEvent);
      const updatedRequest = { ...mockRewardRequest, status: RewardRequestStatus.APPROVED };
      mockRewardRequestService.updateStatus.mockResolvedValue(updatedRequest);

      const result = await controller.updateRewardRequestStatus(
        TEST_EVENT_ID,
        mockRewardRequest._id.toString(),
        RewardRequestStatus.APPROVED
      );

      expect(result).toEqual(updatedRequest);
      expect(eventService.findById).toHaveBeenCalledWith(TEST_EVENT_ID);
      expect(rewardRequestService.updateStatus).toHaveBeenCalledWith(
        mockRewardRequest._id.toString(),
        RewardRequestStatus.APPROVED
      );
    });
  });
});