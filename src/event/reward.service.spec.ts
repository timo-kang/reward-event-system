import { Test, TestingModule } from '@nestjs/testing';
import { RewardService } from './reward.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reward } from './schemas/reward.schema';

describe('RewardService', () => {
  let service: RewardService;
  let rewardModel: Model<Reward>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardService,
        {
          provide: getModelToken(Reward.name),
          useValue: {
            // Mock Reward model methods here
            new: jest.fn().mockImplementation(dto => ({
              ...dto,
              save: jest.fn().mockResolvedValue(dto),
              id: 'mockId'
            })),
            constructor: jest.fn().mockResolvedValue({ save: jest.fn().mockResolvedValue('mockReward') }),
            find: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RewardService>(RewardService);
    rewardModel = module.get<Model<Reward>>(getModelToken(Reward.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new reward', async () => {
      const createRewardDto = { name: 'Test Reward', description: 'Description', type: 'points', value: 100, event: 'eventId' };
      const mockReward = {
        ...createRewardDto,
        save: jest.fn().mockResolvedValue(createRewardDto)
      };
      const result = await service.create(createRewardDto as any); // Cast to any for simplicity in test
      expect(result).toEqual('mockReward'); // Based on the mocked save method
      expect(rewardModel.constructor).toHaveBeenCalledWith(createRewardDto);
    });
  });

  describe('findByEvent', () => {
    it('should return all rewards for a given event ID', async () => {
      const eventId = 'someEventId';
      const mockRewards = [{ name: 'Reward 1' }, { name: 'Reward 2' }];
      (rewardModel.find as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRewards),
      } as any);
      // Assuming your RewardService has a method called findByEvent
      const result = await service.findByEvent(eventId);
      expect(result).toEqual(mockRewards);
      expect(rewardModel.find).toHaveBeenCalledWith({ event: eventId });
    });
  });

  describe('findAll', () => {
    it('should return all rewards', async () => {
      const mockRewards = [{ name: 'Reward 1' }, { name: 'Reward 2' }];
      (rewardModel.find as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRewards),
      } as any);

      const result = await service.findAll();
      expect(result).toEqual(mockRewards);
      expect(rewardModel.find).toHaveBeenCalledWith();
    });
  });

  describe('findById', () => {
    it('should return a reward if found', async () => {
      const rewardId = 'someRewardId';
      const mockReward = { _id: rewardId, name: 'Test Reward' };
      (rewardModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReward),
      } as any);

      const result = await service.findById(rewardId);
      expect(result).toEqual(mockReward);
      expect(rewardModel.findById).toHaveBeenCalledWith(rewardId);
    });

    it('should return null if reward not found', async () => {
      const rewardId = 'someRewardId';
      (rewardModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.findById(rewardId);
      expect(result).toBeNull();
      expect(rewardModel.findById).toHaveBeenCalledWith(rewardId);
    });
  });

  describe('update', () => {
    it('should update a reward', async () => {
      const rewardId = 'someRewardId';
      const updateRewardDto = { name: 'Updated Reward' };
      const mockUpdatedReward = { _id: rewardId, name: 'Updated Reward' };
      (rewardModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedReward),
      } as any);

      const result = await service.update(rewardId, updateRewardDto as any);
      expect(result).toEqual(mockUpdatedReward);
      expect(rewardModel.findByIdAndUpdate).toHaveBeenCalledWith(rewardId, updateRewardDto, { new: true });
    });
  });

  describe('remove', () => {
    it('should remove a reward', async () => {
      const rewardId = 'someRewardId';
      (rewardModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null); // Mocking delete successful response

      await service.remove(rewardId);
      expect(rewardModel.findByIdAndDelete).toHaveBeenCalledWith(rewardId);
    });
  });
});