import { Model, Types } from 'mongoose';
import { Event, EventDocument } from '../event/schemas/event.schema';
import { Reward, RewardDocument } from '../event/schemas/reward.schema';
import { RewardRequest, RewardRequestDocument } from '../event/schemas/reward-request.schema';

class MockModel<T> {
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  static find = jest.fn().mockReturnThis();
  static findOne = jest.fn().mockReturnThis();
  static findById = jest.fn().mockReturnThis();
  static findByIdAndUpdate = jest.fn().mockReturnThis();
  static deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  static exec = jest.fn().mockResolvedValue([]);

  save = jest.fn().mockImplementation(function(this: any) {
    const now = new Date();
    const savedData = {
      ...this.data,
      _id: new Types.ObjectId(),
      createdAt: now,
      updatedAt: now,
    };
    return Promise.resolve(savedData);
  });

  toObject = jest.fn().mockImplementation(function(this: any) {
    return { ...this.data };
  });
}

export class MockEventModel extends MockModel<EventDocument> {
  static find = jest.fn().mockReturnThis();
  static findOne = jest.fn().mockReturnThis();
  static findById = jest.fn().mockReturnThis();
  static findByIdAndUpdate = jest.fn().mockReturnThis();
  static deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  static exec = jest.fn().mockResolvedValue([]);

  save = jest.fn().mockImplementation(function(this: any) {
    const now = new Date();
    const savedData = {
      ...this.data,
      _id: new Types.ObjectId(),
      createdAt: now,
      updatedAt: now,
    };
    return Promise.resolve(savedData);
  });
}

export class MockRewardModel extends MockModel<RewardDocument> {
  static find = jest.fn().mockReturnThis();
  static findOne = jest.fn().mockReturnThis();
  static findById = jest.fn().mockReturnThis();
  static findByIdAndUpdate = jest.fn().mockReturnThis();
  static deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  static exec = jest.fn().mockResolvedValue([]);

  save = jest.fn().mockImplementation(function(this: any) {
    const now = new Date();
    const savedData = {
      ...this.data,
      _id: new Types.ObjectId(),
      createdAt: now,
      updatedAt: now,
    };
    return Promise.resolve(savedData);
  });
}

export class MockRewardRequestModel extends MockModel<RewardRequestDocument> {
  static find = jest.fn().mockReturnThis();
  static findOne = jest.fn().mockReturnThis();
  static findById = jest.fn().mockReturnThis();
  static findByIdAndUpdate = jest.fn().mockReturnThis();
  static deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  static exec = jest.fn().mockResolvedValue([]);

  save = jest.fn().mockImplementation(function(this: any) {
    const now = new Date();
    const savedData = {
      ...this.data,
      _id: new Types.ObjectId(),
      createdAt: now,
      updatedAt: now,
    };
    return Promise.resolve(savedData);
  });
}

export const createMockEvent = (id: string, operatorId?: string) => ({
  _id: new Types.ObjectId(id),
  name: 'Test Event',
  description: 'Test Description',
  is_active: true,
  start_date: new Date('2025-05-20T06:15:53.199Z'),
  end_date: new Date('2025-05-27T06:15:53.199Z'),
  conditions: [
    {
      type: 'minimumPoints',
      value: 100,
      description: 'Minimum points required',
    },
  ],
  rewards: [],
  createdAt: new Date('2025-05-20T06:15:53.199Z'),
  updatedAt: new Date('2025-05-20T06:15:53.199Z'),
});

export const createMockReward = (id: string, eventId: string) => ({
  _id: new Types.ObjectId(id),
  name: 'Test Reward',
  description: 'Test Reward Description',
  type: 'POINTS',
  value: 100,
  event: eventId,
  is_active: true,
  createdAt: new Date('2025-05-20T06:15:53.199Z'),
  updatedAt: new Date('2025-05-20T06:15:53.199Z'),
});

export const createMockRewardRequest = (
  id: string,
  eventId: string,
  rewardId: string,
  userId: string,
) => ({
  _id: new Types.ObjectId(id),
  event: eventId,
  reward: rewardId,
  user: userId,
  status: 'PENDING',
  request_date: new Date('2025-05-20T06:15:53.333Z'),
  createdAt: new Date('2025-05-20T06:15:53.333Z'),
  updatedAt: new Date('2025-05-20T06:15:53.333Z'),
}); 