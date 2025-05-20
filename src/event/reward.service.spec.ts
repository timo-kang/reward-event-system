import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RewardService } from './reward.service';
import { Reward, RewardDocument } from './schemas/reward.schema';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateRewardDto } from './dto/create-reward.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MockEventModel, MockRewardModel, createMockEvent, createMockReward } from '../test/mock-models';
import { Types } from 'mongoose';
import { RewardType } from './schemas/reward.schema';

const TEST_EVENT_ID = '507f1f77bcf86cd799439011';
const TEST_REWARD_ID = '507f1f77bcf86cd799439012';

describe('RewardService', () => {
  let service: RewardService;
  let rewardModel: typeof MockRewardModel;
  let eventModel: typeof MockEventModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardService,
        {
          provide: getModelToken(Reward.name),
          useValue: MockRewardModel,
        },
        {
          provide: getModelToken(Event.name),
          useValue: MockEventModel,
        },
      ],
    }).compile();

    service = module.get<RewardService>(RewardService);
    rewardModel = module.get(getModelToken(Reward.name));
    eventModel = module.get(getModelToken(Event.name));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a reward successfully', async () => {
      const createRewardDto: CreateRewardDto = {
        name: 'Test Reward',
        description: 'Test Reward Description',
        type: RewardType.POINTS,
        value: 100,
        event: TEST_EVENT_ID,
      };

      const mockEvent = createMockEvent(TEST_EVENT_ID);
      const mockReward = {
        _id: new Types.ObjectId(TEST_REWARD_ID),
        ...createRewardDto,
        is_active: true,
        createdAt: new Date('2025-05-20T06:15:53.199Z'),
        updatedAt: new Date('2025-05-20T06:15:53.199Z'),
      };

      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(mockEvent);
      
      const newReward = new MockRewardModel(createRewardDto);
      newReward.save = jest.fn().mockResolvedValue(mockReward);

      MockEventModel.findById.mockResolvedValue(createMockEvent(TEST_EVENT_ID));

      const result = await service.create(TEST_EVENT_ID, createRewardDto);
      expect(result).toEqual(mockReward);
      expect(result).toBeDefined();
      expect(result).toMatchObject({
        _id: mockReward._id,
        ...createRewardDto,
        is_active: true,
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(MockEventModel.findById).toHaveBeenCalledWith(TEST_EVENT_ID);
      expect(newReward.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when event not found', async () => {
      const createRewardDto: CreateRewardDto = {
        name: 'Test Reward',
        description: 'Test Reward Description',
        type: RewardType.POINTS,
        value: 100,
        event: TEST_EVENT_ID,
      };

      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(null);

      await expect(service.create(TEST_EVENT_ID, createRewardDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when event is not active', async () => {
      const createRewardDto: CreateRewardDto = {
        name: 'Test Reward',
        description: 'Test Reward Description',
        type: RewardType.POINTS,
        value: 100,
        event: TEST_EVENT_ID,
      };

      const mockEvent = createMockEvent(TEST_EVENT_ID);
      mockEvent.is_active = false;

      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(mockEvent);

      await expect(service.create(TEST_EVENT_ID, createRewardDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when reward name is empty', async () => {
      const invalidDto = {
        ...createMockReward(TEST_REWARD_ID, TEST_EVENT_ID),
        name: '',
      };

      await expect(service.create(TEST_EVENT_ID, invalidDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when reward value is negative', async () => {
      const invalidDto = {
        ...createMockReward(TEST_REWARD_ID, TEST_EVENT_ID),
        value: -100,
      };

      await expect(service.create(TEST_EVENT_ID, invalidDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findByEvent', () => {
    it('should return rewards for an event', async () => {
      const mockEvent = createMockEvent(TEST_EVENT_ID);
      const mockRewards = [
        createMockReward(TEST_REWARD_ID, TEST_EVENT_ID),
        createMockReward('507f1f77bcf86cd799439013', TEST_EVENT_ID),
      ];

      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(mockEvent);
      MockRewardModel.find.mockReturnThis();
      MockRewardModel.exec.mockResolvedValue(mockRewards);

      const result = await service.findByEvent(TEST_EVENT_ID);

      expect(result).toEqual(mockRewards);
      expect(MockEventModel.findById).toHaveBeenCalledWith(TEST_EVENT_ID);
      expect(MockRewardModel.find).toHaveBeenCalledWith({ event: TEST_EVENT_ID });
    });

    it('should throw NotFoundException when event not found', async () => {
      MockEventModel.findById.mockReturnThis();
      MockEventModel.exec.mockResolvedValue(null);

      await expect(service.findByEvent(TEST_EVENT_ID))
        .rejects.toThrow(NotFoundException);
      expect(MockRewardModel.find).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a reward by id', async () => {
      const mockReward = createMockReward(TEST_REWARD_ID, TEST_EVENT_ID);
      
      MockRewardModel.findById.mockReturnThis();
      MockRewardModel.exec.mockResolvedValue(mockReward);

      const result = await service.findById(TEST_REWARD_ID);

      expect(result).toEqual(mockReward);
      expect(MockRewardModel.findById).toHaveBeenCalledWith(TEST_REWARD_ID);
    });

    it('should throw NotFoundException when reward not found', async () => {
      MockRewardModel.findById.mockReturnThis();
      MockRewardModel.exec.mockResolvedValue(null);

      await expect(service.findById(TEST_REWARD_ID))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a reward successfully', async () => {
      const updateRewardDto = {
        name: 'Updated Reward',
        description: 'Updated Description',
      };

      const updatedReward = createMockReward(TEST_REWARD_ID, TEST_EVENT_ID);
      updatedReward.name = 'Updated Reward';
      updatedReward.description = 'Updated Description';

      MockRewardModel.findByIdAndUpdate.mockReturnThis();
      MockRewardModel.exec.mockResolvedValue(updatedReward);

      const result = await service.update(TEST_REWARD_ID, updateRewardDto);

      expect(result).toEqual(updatedReward);
      expect(MockRewardModel.findByIdAndUpdate).toHaveBeenCalledWith(
        TEST_REWARD_ID,
        updateRewardDto,
        { new: true },
      );
    });

    it('should throw NotFoundException when reward not found', async () => {
      const updateRewardDto = {
        name: 'Updated Reward',
        description: 'Updated Description',
      };

      MockRewardModel.findByIdAndUpdate.mockReturnThis();
      MockRewardModel.exec.mockResolvedValue(null);

      await expect(service.update(TEST_REWARD_ID, updateRewardDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a reward successfully', async () => {
      const mockDeleteResult = { deletedCount: 1 };
      MockRewardModel.deleteOne.mockResolvedValue(mockDeleteResult);

      await service.remove(TEST_REWARD_ID);

      expect(MockRewardModel.deleteOne).toHaveBeenCalledWith({ _id: TEST_REWARD_ID });
    });

    it('should throw NotFoundException when reward not found', async () => {
      const mockDeleteResult = { deletedCount: 0 };
      MockRewardModel.deleteOne.mockResolvedValue(mockDeleteResult);

      await expect(service.remove(TEST_REWARD_ID))
        .rejects.toThrow(NotFoundException);
    });
  });
});