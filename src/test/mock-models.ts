import { Types } from 'mongoose';

export class MockModel {
  constructor(private data: any) {}
  save = jest.fn().mockResolvedValue(this.data);
  static find = jest.fn().mockReturnThis();
  static findById = jest.fn().mockReturnThis();
  static findByIdAndUpdate = jest.fn().mockReturnThis();
  static findOne = jest.fn().mockReturnThis();
  static exec = jest.fn();
}

export class MockEventModel extends MockModel {
  static find = jest.fn().mockReturnThis();
  static findById = jest.fn().mockReturnThis();
  static findByIdAndUpdate = jest.fn().mockReturnThis();
  static findOne = jest.fn().mockReturnThis();
  static exec = jest.fn();
}

export class MockRewardModel extends MockModel {
  static find = jest.fn().mockReturnThis();
  static findById = jest.fn().mockReturnThis();
  static findByIdAndUpdate = jest.fn().mockReturnThis();
  static exec = jest.fn();
}

export class MockRewardRequestModel extends MockModel {
  static find = jest.fn().mockReturnThis();
  static findById = jest.fn().mockReturnThis();
  static findByIdAndUpdate = jest.fn().mockReturnThis();
  static findOne = jest.fn().mockReturnThis();
  static exec = jest.fn();
}

export const createMockEvent = (id = '507f1f77bcf86cd799439011', operatorId = '507f1f77bcf86cd799439012') => ({
  _id: new Types.ObjectId(id),
  name: 'Test Event',
  description: 'Test Description',
  start_date: new Date(),
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  is_active: true,
  created_by: new Types.ObjectId(operatorId),
  conditions: [
    {
      type: 'minimumPoints',
      value: 100,
      description: 'Minimum points required'
    },
    {
      type: 'consecutiveLogins',
      value: 3,
      description: 'Minimum consecutive logins required'
    },
    {
      type: 'invitedFriends',
      value: 2,
      description: 'Minimum invited friends required'
    }
  ],
  created_at: new Date(),
  updated_at: new Date(),
});

export const createMockReward = (id = '507f1f77bcf86cd799439012', eventId = '507f1f77bcf86cd799439011') => ({
  _id: new Types.ObjectId(id),
  name: 'Test Reward',
  description: 'Test Reward Description',
  type: 'POINTS',
  value: 100,
  event: new Types.ObjectId(eventId),
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
});

export const createMockRewardRequest = (
  id = '507f1f77bcf86cd799439013',
  userId = '507f1f77bcf86cd799439014',
  eventId = '507f1f77bcf86cd799439011',
  rewardId = '507f1f77bcf86cd799439012'
) => ({
  _id: new Types.ObjectId(id),
  user: new Types.ObjectId(userId),
  event: new Types.ObjectId(eventId),
  reward: new Types.ObjectId(rewardId),
  status: 'PENDING',
  created_at: new Date(),
  updated_at: new Date(),
}); 