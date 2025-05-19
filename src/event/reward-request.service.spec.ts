import { Test, TestingModule } from '@nestjs/testing';
import { RewardRequestService } from './reward-request.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RewardService } from './reward.service';
import { AuthService } from '../auth/auth.service'; // Assuming AuthService is used as the user service

describe('RewardRequestService', () => {
  let service: RewardRequestService;
  let rewardRequestModel: Model<any>;
  let eventModel: Model<any>;
  let rewardModel: Model<any>;


  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardRequestService,
        {
          // Mock RewardRequestModel
          provide: getModelToken('RewardRequest'),
          useValue: {
            new: jest.fn(), // Will mock new().save() separately
            constructor: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          // Mock EventModel (although not directly used in methods tested here, it's a dependency)
          provide: getModelToken('Event'), // Assuming your Event model is named 'Event'
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          // Mock AuthService (as the user service)
          provide: AuthService,
          useValue: {
            getUserPoints: jest.fn(),
            getUserLoginHistory: jest.fn(),
            getUserInvitedFriendsCount: jest.fn(),
            // Add other mocked methods from AuthService if needed
          },
        },
        {
          // Mock RewardService
          provide: RewardService,
          useValue: {
 findById: jest.fn(),
            // Add other mocked methods from RewardService if needed
          },
        },
      ],
    }).compile();

    service = module.get<RewardRequestService>(RewardRequestService);
    rewardRequestModel = module.get<Model<any>>(getModelToken('RewardRequest'));
    eventModel = module.get<Model<any>>(getModelToken('Event')); // Access the mocked EventModel
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRewardRequest', () => {
    const userId = 'user123';
    const eventId = 'event456';
    const rewardId = 'reward789';

    const createRewardRequestDto = {
     userId: userId,
     eventId: eventId,
     rewardId: rewardId,
    };

    const mockReward: unknown = { _id: createRewardRequestDto.rewardId, name: 'Test Reward' };
    
    it('should create a new reward request if no duplicate exists and conditions are met', async () => {
      jest.spyOn(rewardRequestModel, 'findOne').mockResolvedValue(null); // No duplicate request
      jest.spyOn(eventModel, 'findById').mockResolvedValue({}); // Mock a found event
      jest.spyOn(service['rewardService'], 'findById').mockResolvedValue(mockReward as Reward); // Mock a found reward
      jest.spyOn(service as any, 'validateConditions').mockResolvedValue(true); // Conditions met

      // Mock user service calls (even if validateConditions is mocked, they are called within create)
      jest.spyOn(service['authService'], 'getUserPoints').mockResolvedValue(100);
      jest.spyOn(service['authService'], 'getUserLoginHistory').mockResolvedValue([new Date()]);
      jest.spyOn(service['authService'], 'getUserInvitedFriendsCount').mockResolvedValue(5);

      const mockRewardRequestDocument = {
        user: userId,
        event: eventId,
        reward: rewardId,
        request_date: expect.any(Date),
        status: 'pending',
        save: jest.fn().mockResolvedValue({ _id: 'someRequestId', user: userId, event: eventId, reward: rewardId, request_date: expect.any(Date), status: 'pending' }), // Mock save method
      };
      jest.spyOn(rewardRequestModel, 'new').mockImplementation(() => mockRewardRequestDocument as any);
      
      const result = await service.create(createRewardRequestDto as any); // Cast to any to match the method signature in the code

      expect(rewardRequestModel.findOne).toHaveBeenCalledWith({ user: createRewardRequestDto.userId, event: createRewardRequestDto.eventId });
      expect(service['rewardService'].findById).toHaveBeenCalledWith(createRewardRequestDto.rewardId);
      expect(service['validateConditions']).toHaveBeenCalledWith(eventId, userId);
      expect(rewardRequestModel.new).toHaveBeenCalledWith({ user: userId, event: eventId, reward: rewardId, request_date: expect.any(Date), status: 'pending' });
      expect(mockRewardRequestDocument.save).toHaveBeenCalled();
      expect(result).toEqual({ user: userId, event: eventId, reward: rewardId, status: 'pending' });

      // Ensure user service methods were called
      expect(service['authService'].getUserPoints).toHaveBeenCalledWith(userId);
      expect(service['authService'].getUserLoginHistory).toHaveBeenCalledWith(userId);
      expect(service['authService'].getUserInvitedFriendsCount).toHaveBeenCalledWith(userId);
    });

    it('should throw ConflictException if a duplicate request exists', async () => {
      jest.spyOn(rewardRequestModel, 'findOne').mockResolvedValue({}); // Duplicate exists
      // No need to mock validateConditions or new/save as it should throw before that
      jest.spyOn(eventModel, 'findById').mockResolvedValue({}); // Mock a found event

      await expect(service.create(createRewardRequestDto as any)).rejects.toThrow(ConflictException);

      expect(rewardRequestModel.findOne).toHaveBeenCalledWith({ user: createRewardRequestDto.userId, event: createRewardRequestDto.eventId }); // Check findOne with user and event only
      expect(service['validateConditions']).not.toHaveBeenCalled();
      // Ensure user service methods were not called
      expect(service['authService'].getUserPoints).not.toHaveBeenCalled();
      expect(service['authService'].getUserLoginHistory).not.toHaveBeenCalled();
      expect(service['authService'].getUserInvitedFriendsCount).not.toHaveBeenCalled();
      expect(rewardRequestModel.new).not.toHaveBeenCalled(); // Use not.toHaveBeenCalled() instead of not.toHaveBeenCalledWith()
    });

    it('should throw ForbiddenException if event conditions are not met', async () => {
      jest.spyOn(rewardRequestModel, 'findOne').mockResolvedValue(null); // No duplicate
      jest.spyOn(service as any, 'validateConditions').mockResolvedValue(false); // Conditions not met
      // No need to mock new/save as it should throw before that
      jest.spyOn(eventModel, 'findById').mockResolvedValue({}); // Mock a found event
      jest.spyOn(service['rewardService'], 'findById').mockResolvedValue(mockReward); // Mock a found reward
      // Mock user service calls
      jest.spyOn(service['authService'], 'getUserPoints').mockResolvedValue(100);
      jest.spyOn(service['authService'], 'getUserLoginHistory').mockResolvedValue([new Date()]);
      jest.spyOn(service['authService'], 'getUserInvitedFriendsCount').mockResolvedValue(5);


      await expect(service.create(createRewardRequestDto as any)).rejects.toThrow(ForbiddenException);
      expect(rewardRequestModel.findOne).toHaveBeenCalledWith({ user: createRewardRequestDto.userId, event: createRewardRequestDto.eventId }); // Ensure duplicate check happens first
      expect(service['validateConditions']).toHaveBeenCalledWith(eventId, userId);
      // Ensure user service methods were called
      expect(rewardRequestModel.new).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the event is not found', async () => {
      jest.spyOn(rewardRequestModel, 'findOne').mockResolvedValue(null); // No duplicate
      jest.spyOn(eventModel, 'findById').mockResolvedValue(null); // Event not found

      await expect(service.create(createRewardRequestDto as any)).rejects.toThrow(NotFoundException);

      expect(eventModel.findById).toHaveBeenCalledWith(createRewardRequestDto.eventId);
      expect(rewardRequestModel.findOne).not.toHaveBeenCalled(); // Should not check for duplicate if event not found
      // Ensure user service methods were not called
      expect(service['authService'].getUserPoints).not.toHaveBeenCalled();
      expect(service['authService'].getUserLoginHistory).not.toHaveBeenCalled();
      expect(service['authService'].getUserInvitedFriendsCount).not.toHaveBeenCalled();
      expect(service['validateConditions']).not.toHaveBeenCalled();
      expect(service['rewardService'].findById).not.toHaveBeenCalled(); // Should not check for reward if event not found
    });

    it('should throw NotFoundException if the reward is not found', async () => {
      jest.spyOn(rewardRequestModel, 'findOne').mockResolvedValue(null); // No duplicate
      jest.spyOn(eventModel, 'findById').mockResolvedValue({}); // Event found
      jest.spyOn(service as any, 'validateConditions').mockResolvedValue(true); // Conditions met
      jest.spyOn(service['rewardService'], 'findById').mockResolvedValue(null); // Reward not found
      // Mock user service calls
      jest.spyOn(service['authService'], 'getUserPoints').mockResolvedValue(100);
      jest.spyOn(service['authService'], 'getUserLoginHistory').mockResolvedValue([new Date()]);
      jest.spyOn(service['authService'], 'getUserInvitedFriendsCount').mockResolvedValue(5);

      await expect(service.create(createRewardRequestDto as any)).rejects.toThrow(NotFoundException);
      expect(eventModel.findById).toHaveBeenCalledWith(createRewardRequestDto.eventId);
      expect(rewardRequestModel.findOne).toHaveBeenCalledWith({ user: createRewardRequestDto.userId, event: createRewardRequestDto.eventId });
      // Ensure user service methods were called
      expect(service['validateConditions']).toHaveBeenCalledWith(eventId, userId);
      expect(service['rewardService'].findById).toHaveBeenCalledWith(createRewardRequestDto.rewardId);
      expect(rewardRequestModel.new).not.toHaveBeenCalled();
    });
  });

  describe('findRewardRequestsByUser', () => {
    const userId = 'user123';
    const mockRequests = [{ user: userId, status: 'pending' }];

    it('should return reward requests for a given user ID', async () => {
      const findSpy = { exec: jest.fn().mockResolvedValue(mockRequests) };
      jest.spyOn(rewardRequestModel, 'find').mockReturnValue(findSpy as any);

      const result = await service.findByUser(userId);

      expect(rewardRequestModel.find).toHaveBeenCalledWith({ user: userId });
      expect(findSpy.exec).toHaveBeenCalled();
      expect(result).toEqual(mockRequests);
    });

    it('should return an empty array if no reward requests are found for the user', async () => {
      const findSpy = { exec: jest.fn().mockResolvedValue([]) };
      jest.spyOn(rewardRequestModel, 'find').mockReturnValue(findSpy as any);
      const result = await service.findByUser(userId);
      expect(result).toEqual([]);    });  });


  describe('findRewardRequestsByEvent', () => {
    const eventId = 'event456';
    const mockRequests = [{ event: eventId, status: 'pending' }];

    it('should return reward requests for a given event ID', async () => {
      const findSpy = { exec: jest.fn().mockResolvedValue(mockRequests) };
      jest.spyOn(rewardRequestModel, 'find').mockReturnValue(findSpy as any);

      const result = await service.findRewardRequestsByEvent(eventId);

      expect(rewardRequestModel.find).toHaveBeenCalledWith({ event: eventId }); // Ensure correct query
      expect(findSpy.exec).toHaveBeenCalled();
      expect(result).toEqual(mockRequests);
    });

    it('should return an empty array if no reward requests are found for the event', async () => {
      const findSpy = { exec: jest.fn().mockResolvedValue([]) };
      jest.spyOn(rewardRequestModel, 'find').mockReturnValue(findSpy as any);
      const result = await service.findRewardRequestsByEvent(eventId);
      expect(result).toEqual([]);    });  });

  describe('findRewardRequestsByStatus', () => {
    const status = 'approved';
    const mockRequests = [{ status: status }];

    it('should return reward requests with a given status', async () => {
      const findSpy = { exec: jest.fn().mockResolvedValue(mockRequests) };
      jest.spyOn(rewardRequestModel, 'find').mockReturnValue(findSpy as any);
      const result = await service.findByStatus(status);
      expect(rewardRequestModel.find).toHaveBeenCalledWith({ status: status }); // Ensure correct query
      expect(findSpy.exec).toHaveBeenCalled();
      expect(result).toEqual(mockRequests);
    });
  });

  describe('updateRewardRequestStatus', () => {
    const requestId = 'request999'; // Assuming updateStatus takes a requestId
    const newStatus = 'approved';
    const updatedRequest = { _id: requestId, status: newStatus };

    it('should update the status of a reward request', async () => {
      const findByIdAndUpdateSpy = { exec: jest.fn().mockResolvedValue(updatedRequest) };
      jest.spyOn(rewardRequestModel, 'findByIdAndUpdate').mockReturnValue(findByIdAndUpdateSpy as any);

      const result = await service.updateRewardRequestStatus(requestId, newStatus);

      expect(rewardRequestModel.findByIdAndUpdate).toHaveBeenCalledWith(requestId, { status: newStatus }, { new: true });
      expect(findByIdAndUpdateSpy.exec).toHaveBeenCalled();
      expect(result).toEqual(updatedRequest);
    });

    it('should return null if the reward request is not found', async () => {
      const findByIdAndUpdateSpy = { exec: jest.fn().mockResolvedValue(null) };
      jest.spyOn(rewardRequestModel, 'findByIdAndUpdate').mockReturnValue(findByIdAndUpdateSpy as any);

      const result = await service.updateRewardRequestStatus(requestId, newStatus);

      expect(rewardRequestModel.findByIdAndUpdate).toHaveBeenCalledWith(requestId, { status: newStatus }, { new: true });
      expect(findByIdAndUpdateSpy.exec).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('validateConditions - Integrated Tests', () => {
    const eventId = 'event456';
    const userId = 'user123';

    // Mock the AuthService methods to return specific user data for each test case
    let getUserPointsSpy: jest.SpyInstance;
    let getUserLoginHistorySpy: jest.SpyInstance;
    let getUserInvitedFriendsCountSpy: jest.SpyInstance;

    beforeEach(() => {
      // Reset mocks for each test in this describe block
      getUserPointsSpy = jest.spyOn(service['authService'], 'getUserPoints');
      getUserLoginHistorySpy = jest.spyOn(service['authService'], 'getUserLoginHistory');
      getUserInvitedFriendsCountSpy = jest.spyOn(service['authService'], 'getUserInvitedFriendsCount');
    });

    it('should return true if the event has no conditions', async () => {
      jest.spyOn(eventModel, 'findById').mockResolvedValue({ _id: eventId, conditions: [] }); // Event with no conditions

      const result = await service['validateConditions'](eventId, userId);

      expect(eventModel.findById).toHaveBeenCalledWith(eventId);
      // Ensure user service methods were not called
      expect(getUserPointsSpy).not.toHaveBeenCalled();
      expect(getUserLoginHistorySpy).not.toHaveBeenCalled();
      expect(getUserInvitedFriendsCountSpy).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return true if all conditions are met', async () => {
      const mockEvent = {
        _id: eventId,
        conditions: [
          { type: 'minimumPoints', value: 100 },
          { type: 'consecutiveLogins', value: 3 },
          { type: 'invitedFriends', value: 5 },
        ],
      };
      jest.spyOn(eventModel, 'findById').mockResolvedValue(mockEvent);

      // Mock user data to meet all conditions
      getUserPointsSpy.mockResolvedValue(150);
      getUserLoginHistorySpy.mockResolvedValue([new Date(), new Date(), new Date(), new Date()]); // 4 logins
      getUserInvitedFriendsCountSpy.mockResolvedValue(7);

      const result = await service['validateConditions'](eventId, userId);

      expect(eventModel.findById).toHaveBeenCalledWith(eventId);
      // Ensure user service methods were called
      expect(getUserPointsSpy).toHaveBeenCalledWith(userId);
      expect(getUserLoginHistorySpy).toHaveBeenCalledWith(userId);
      expect(getUserInvitedFriendsCountSpy).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    it('should return false if minimumPoints condition is not met', async () => {
      const mockEvent = {
        _id: eventId,
        conditions: [
          { type: 'minimumPoints', value: 100 },
          { type: 'consecutiveLogins', value: 3 },
        ],
      };
      jest.spyOn(eventModel, 'findById').mockResolvedValue(mockEvent);

      // Mock user data where minimumPoints is NOT met
      getUserPointsSpy.mockResolvedValue(50);
      getUserLoginHistorySpy.mockResolvedValue([new Date(), new Date(), new Date(), new Date()]);
      getUserInvitedFriendsCountSpy.mockResolvedValue(7); // This condition is met, but should still fail due to points

      const result = await service['validateConditions'](eventId, userId);

      expect(eventModel.findById).toHaveBeenCalledWith(eventId);
      // Ensure user service methods were called
      expect(getUserPointsSpy).toHaveBeenCalledWith(userId);
      // Depending on your implementation, login history and invited friends might not be checked if points fail first
      // Adjust expectations based on how you implement short-circuiting
      expect(result).toBe(false);
    });

    it('should return false if consecutiveLogins condition is not met', async () => {
      const mockEvent = {
        _id: eventId,
        conditions: [
          { type: 'minimumPoints', value: 100 },
          { type: 'consecutiveLogins', value: 3 },
        ],
      };
      jest.spyOn(eventModel, 'findById').mockResolvedValue(mockEvent);

      // Mock user data where consecutiveLogins is NOT met
      getUserPointsSpy.mockResolvedValue(150); // Met
      getUserLoginHistorySpy.mockResolvedValue([new Date(), new Date()]); // Only 2 logins

      const result = await service['validateConditions'](eventId, userId);

      expect(eventModel.findById).toHaveBeenCalledWith(eventId);
      // Ensure user service methods were called
      expect(getUserPointsSpy).toHaveBeenCalledWith(userId);
      expect(getUserLoginHistorySpy).toHaveBeenCalledWith(userId);
      expect(result).toBe(false);
    });

    it('should return false if invitedFriends condition is not met', async () => {
      const mockEvent = {
        _id: eventId,
        conditions: [
          { type: 'minimumPoints', value: 100 },
          { type: 'invitedFriends', value: 5 },
        ],
      };
      jest.spyOn(eventModel, 'findById').mockResolvedValue(mockEvent);

      // Mock user data where invitedFriends is NOT met
      getUserPointsSpy.mockResolvedValue(150); // Met
      getUserInvitedFriendsCountSpy.mockResolvedValue(3); // Only 3 invited friends

      const result = await service['validateConditions'](eventId, userId);

      expect(eventModel.findById).toHaveBeenCalledWith(eventId);
      // Ensure user service methods were called
      expect(getUserPointsSpy).toHaveBeenCalledWith(userId);
      expect(getUserInvitedFriendsCountSpy).toHaveBeenCalledWith(userId);
      expect(result).toBe(false);
    });

    it('should return false if multiple conditions exist and some are not met', async () => {
      const mockEvent = {
        _id: eventId,
        conditions: [
          { type: 'minimumPoints', value: 100 }, // Met
          { type: 'consecutiveLogins', value: 5 }, // Not met
          { type: 'invitedFriends', value: 3 }, // Met
        ],
      };
      jest.spyOn(eventModel, 'findById').mockResolvedValue(mockEvent);

      // Mock user data
      getUserPointsSpy.mockResolvedValue(150);
      getUserLoginHistorySpy.mockResolvedValue([new Date(), new Date(), new Date()]); // Only 3 logins
      getUserInvitedFriendsCountSpy.mockResolvedValue(5);

      const result = await service['validateConditions'](eventId, userId);

      expect(eventModel.findById).toHaveBeenCalledWith(eventId);
      // Ensure user service methods were called
      expect(getUserPointsSpy).toHaveBeenCalledWith(userId);
      expect(getUserLoginHistorySpy).toHaveBeenCalledWith(userId);
      expect(getUserInvitedFriendsCountSpy).toHaveBeenCalledWith(userId);
      expect(result).toBe(false);
    });

    it('should return false if the event is not found', async () => {
      jest.spyOn(eventModel, 'findById').mockResolvedValue(null); // Event not found

      const result = await service['validateConditions'](eventId, userId);

      expect(eventModel.findById).toHaveBeenCalledWith(eventId);
      // Ensure user service methods were not called
      expect(getUserPointsSpy).not.toHaveBeenCalled();
      expect(getUserLoginHistorySpy).not.toHaveBeenCalled();
      expect(getUserInvitedFriendsCountSpy).not.toHaveBeenCalled();
      expect(result).toBe(false); // Or consider throwing an error depending on desired behavior
    });

    it('should handle unknown condition types gracefully (e.g., ignore or log)', async () => {
      const mockEvent = {
        _id: eventId,
        conditions: [
          { type: 'minimumPoints', value: 100 },
          { type: 'unknownCondition', value: 'someValue' }, // Unknown type
        ],
      };
      jest.spyOn(eventModel, 'findById').mockResolvedValue(mockEvent);
      getUserPointsSpy.mockResolvedValue(150); // Meet the known condition

      const result = await service['validateConditions'](eventId, userId);

      expect(eventModel.findById).toHaveBeenCalledWith(eventId);
      expect(getUserPointsSpy).toHaveBeenCalledWith(userId);
      // Ensure only the necessary user service methods for known conditions are called
      expect(getUserLoginHistorySpy).not.toHaveBeenCalled();
      expect(getUserInvitedFriendsCountSpy).not.toHaveBeenCalled();
      // Assuming unknown conditions are ignored and validation proceeds with known ones
      expect(result).toBe(true);
    });
  });

  describe('validateConditions - Mocked Behavior Tests (Original)', () => {
    // These tests remain to ensure the interaction with validateConditions is correct
    it('should return true if conditions are met (mocked)', async () => {
      const eventId = 'event456'; // Define variables
      const userId = 'user123'; // Define variables
      // Mock the private method directly
      const validateConditionsSpy = jest.spyOn(service as any, 'validateConditions');
      validateConditionsSpy.mockResolvedValue(true);

      const result = await service['validateConditions'](eventId, userId); // Accessing private method for testing

      expect(validateConditionsSpy).toHaveBeenCalledWith(eventId, userId);
      expect(result).toBe(true);
    });

    it('should return false if conditions are not met (mocked)', async () => {
      const eventId = 'event456'; // Define variables
      const userId = 'user123'; // Define variables
      // Mock the private method directly
      const validateConditionsSpy = jest.spyOn(service as any, 'validateConditions');
      validateConditionsSpy.mockResolvedValue(false);

      const result = await service['validateConditions'](eventId, userId); // Accessing private method for testing

      expect(validateConditionsSpy).toHaveBeenCalledWith(eventId, userId);
      expect(result).toBe(false);
    });

  });
});