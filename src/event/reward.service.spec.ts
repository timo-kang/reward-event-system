import { Test, TestingModule } from '@nestjs/testing';
import { RewardService } from './reward.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reward, RewardType } from './schemas/reward.schema';
import { Event } from './schemas/event.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MockRewardModel, MockEventModel, createMockReward, createMockEvent } from '../test/mock-models';

describe('RewardService', () => {
  let service: RewardService;
  let rewardModel: Model<Reward>;
  let eventModel: Model<Event>;

  const TEST_EVENT_ID = '507f1f77bcf86cd799439011';
  const TEST_REWARD_ID = '507f1f77bcf86cd799439012';

  const mockReward = createMockReward(TEST_REWARD_ID, TEST_EVENT_ID);
  const mockEvent = createMockEvent(TEST_EVENT_ID);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardService,
        {
          provide: getModelToken('Reward'),
          useValue: MockRewardModel,
        },
        {
          provide: getModelToken('Event'),
          useValue: MockEventModel,
        },
      ],
    }).compile();

    service = module.get<RewardService>(RewardService);
    rewardModel = module.get<Model<Reward>>(getModelToken('Reward'));
    eventModel = module.get<Model<Event>>(getModelToken('Event'));

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createRewardDto = {
      name: 'Test Reward',
      description: 'Test Reward Description',
      type: RewardType.POINTS,
      value: 100,
      event: TEST_EVENT_ID,
    };

    it('should create a reward successfully', async () => {
      MockEventModel.exec.mockResolvedValue(mockEvent);
      const newReward = new MockRewardModel(mockReward);
      MockRewardModel.exec.mockResolvedValue(mockReward);

      const result = await service.create(TEST_EVENT_ID, createRewardDto);

      expect(result).toEqual(mockReward);
      expect(MockEventModel.findById).toHaveBeenCalledWith(TEST_EVENT_ID);
      expect(newReward.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when event not found', async () => {
      MockEventModel.exec.mockResolvedValue(null);

      await expect(service.create(TEST_EVENT_ID, createRewardDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when event is not active', async () => {
      MockEventModel.exec.mockResolvedValue({ ...mockEvent, is_active: false });

      await expect(service.create(TEST_EVENT_ID, createRewardDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when reward name is empty', async () => {
      const invalidDto = {
        ...createRewardDto,
        name: '',
      };

      await expect(service.create(TEST_EVENT_ID, invalidDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when reward value is negative', async () => {
      const invalidDto = {
        ...createRewardDto,
        value: -100,
      };

      await expect(service.create(TEST_EVENT_ID, invalidDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findByEvent', () => {
    it('should return rewards for an event', async () => {
      const rewards = [mockReward];
      MockRewardModel.exec.mockResolvedValue(rewards);
      MockEventModel.exec.mockResolvedValue(mockEvent);

      const result = await service.findByEvent(TEST_EVENT_ID);

      expect(result).toEqual(rewards);
      expect(MockRewardModel.find).toHaveBeenCalledWith({ event: TEST_EVENT_ID });
    });

    it('should return empty array when no rewards exist', async () => {
      MockRewardModel.exec.mockResolvedValue([]);
      MockEventModel.exec.mockResolvedValue(mockEvent);

      const result = await service.findByEvent(TEST_EVENT_ID);

      expect(result).toEqual([]);
      expect(MockRewardModel.find).toHaveBeenCalledWith({ event: TEST_EVENT_ID });
    });

  });

  describe('findById', () => {
    it('should return a reward by id', async () => {
      MockRewardModel.exec.mockResolvedValue(mockReward);

      const result = await service.findById(TEST_REWARD_ID);

      expect(result).toEqual(mockReward);
      expect(MockRewardModel.findById).toHaveBeenCalledWith(TEST_REWARD_ID);
    });

    it('should throw NotFoundException when reward not found', async () => {
      MockRewardModel.exec.mockResolvedValue(null);
      await expect(service.findById('nonexistentid'))
        .rejects.toThrow(NotFoundException);
    });

  });

  describe('update', () => {
    const updateRewardDto = {
      name: 'Updated Reward',
      description: 'Updated Description',
    };

    it('should update a reward successfully', async () => {
      const updatedReward = { ...mockReward, ...updateRewardDto };
      MockRewardModel.exec.mockResolvedValue(updatedReward);

      const result = await service.update(TEST_REWARD_ID, updateRewardDto);

      expect(result).toEqual(updatedReward);
      expect(MockRewardModel.findByIdAndUpdate).toHaveBeenCalledWith(
        TEST_REWARD_ID,
        { $set: updateRewardDto },
        { new: true }
      );
    });

    it('should throw NotFoundException when reward not found', async () => {
      MockRewardModel.exec.mockResolvedValue(null);

      await expect(service.update('nonexistentid', updateRewardDto))
        .rejects.toThrow(NotFoundException);
      expect(MockRewardModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw NotFoundException when id is invalid', async () => {
      await expect(service.update('invalid-id', updateRewardDto))
        .rejects.toThrow(NotFoundException);
    });
  });
});