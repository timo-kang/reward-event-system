import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from '../event.controller';
import { EventService } from '../event.service';
import { RewardService } from '../reward.service';
import { RewardRequestService } from '../reward-request.service';

describe('EventController', () => {
  let controller: EventController;
  let eventService: EventService;
  let rewardService: RewardService;
  let rewardRequestService: RewardRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: {
            createEvent: jest.fn(),
            findAllEvents: jest.fn(),
          },
        },
        {
          provide: RewardService,
          useValue: {
            createReward: jest.fn(),
            findRewardsByEventId: jest.fn(),
          },
        },
        {
          provide: RewardRequestService,
          useValue: {
            createRewardRequest: jest.fn(),
            findRewardRequestsByEvent: jest.fn(),
            updateRewardRequestStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    eventService = module.get<EventService>(EventService);
    rewardService = module.get<RewardService>(RewardService);
    rewardRequestService = module.get<RewardRequestService>(RewardRequestService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create an event', async () => {
      const createEventDto = { name: 'Test Event', description: 'Test Description' };
      const createdEvent = { _id: 'someId', ...createEventDto };
      jest.spyOn(eventService, 'createEvent').mockResolvedValue(createdEvent as any);

      expect(await controller.createEvent(createEventDto)).toBe(createdEvent);
      expect(eventService.createEvent).toHaveBeenCalledWith(createEventDto);
    });
  });

  describe('findAllEvents', () => {
    it('should return an array of events', async () => {
      const events = [{ _id: 'id1', name: 'Event 1' }, { _id: 'id2', name: 'Event 2' }];
      jest.spyOn(eventService, 'findAllEvents').mockResolvedValue(events as any);

      expect(await controller.findAllEvents()).toBe(events);
      expect(eventService.findAllEvents).toHaveBeenCalled();
    });
  });

  describe('createReward', () => {
    it('should create a reward for an event', async () => {
      const eventId = 'eventId1';
      const createRewardDto = { name: 'Test Reward', type: 'points', value: 100 };
      const createdReward = { _id: 'rewardId1', event: eventId, ...createRewardDto };
      jest.spyOn(rewardService, 'createReward').mockResolvedValue(createdReward as any);

      expect(await controller.createReward(eventId, createRewardDto)).toBe(createdReward);
      expect(rewardService.createReward).toHaveBeenCalledWith({ ...createRewardDto, event: eventId });
    });
  });

  describe('findRewardsByEvent', () => {
    it('should return an array of rewards for an event', async () => {
      const eventId = 'eventId1';
      const rewards = [{ _id: 'rewardId1', event: eventId }, { _id: 'rewardId2', event: eventId }];
      jest.spyOn(rewardService, 'findRewardsByEventId').mockResolvedValue(rewards as any);

      expect(await controller.findRewardsByEvent(eventId)).toBe(rewards);
      expect(rewardService.findRewardsByEventId).toHaveBeenCalledWith(eventId);
    });
  });

  describe('createRewardRequest', () => {
    it('should create a reward request', async () => {
      const eventId = 'eventId1';
      const rewardId = 'rewardId1';
      // Assuming user information is attached to the request by guards
      const req = { user: { userId: 'userId1' } };
      const createdRequest = { _id: 'requestId1', user: 'userId1', event: eventId, reward: rewardId, status: 'pending' };
      jest.spyOn(rewardRequestService, 'createRewardRequest').mockResolvedValue(createdRequest as any);

      expect(await controller.createRewardRequest(eventId, rewardId, req)).toBe(createdRequest);
      expect(rewardRequestService.createRewardRequest).toHaveBeenCalledWith('userId1', eventId, rewardId);
    });
  });

  describe('findRewardRequestsByEvent', () => {
    it('should return an array of reward requests for an event', async () => {
      const eventId = 'eventId1';
      const requests = [{ _id: 'requestId1', event: eventId }, { _id: 'requestId2', event: eventId }];
      jest.spyOn(rewardRequestService, 'findRewardRequestsByEvent').mockResolvedValue(requests as any);

      expect(await controller.findRewardRequestsByEvent(eventId)).toBe(requests);
      expect(rewardRequestService.findRewardRequestsByEvent).toHaveBeenCalledWith(eventId);
    });
  });

  describe('updateRewardRequestStatus', () => {
    it('should update the status of a reward request', async () => {
      const requestId = 'requestId1';
      const updateStatusDto = { status: 'approved' };
      const updatedRequest = { _id: requestId, status: 'approved' };
      jest.spyOn(rewardRequestService, 'updateRewardRequestStatus').mockResolvedValue(updatedRequest as any);

      expect(await controller.updateRewardRequestStatus(requestId, updateStatusDto)).toBe(updatedRequest);
      expect(rewardRequestService.updateRewardRequestStatus).toHaveBeenCalledWith(requestId, updateStatusDto.status);
    });
  });
});