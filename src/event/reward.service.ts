import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRewardDto } from './dto/create-reward.dto';
import { Reward, RewardDocument } from './schemas/reward.schema';
import { Event, EventDocument } from './schemas/event.schema';

@Injectable()
export class RewardService {
  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
  ) {}

  async create(createRewardDto: CreateRewardDto): Promise<Reward> {
    const createdReward = new this.rewardModel(createRewardDto);
    return createdReward.save();
  }

  async findByEvent(eventId: string): Promise<Reward[]> {
    return this.rewardModel.find({ event: new Types.ObjectId(eventId) }).exec();
  }

  async findAll(): Promise<Reward[]> {
    return this.rewardModel.find().exec();
  }

  async findById(rewardId: string): Promise<Reward> {
    return this.rewardModel.findById(rewardId).exec();
  }

  async update(id: string, updateRewardDto: any): Promise<Reward> {
    return this.rewardModel.findByIdAndUpdate(id, updateRewardDto, { new: true }).exec();
  }

  async remove(id: string): Promise<any> {
    return this.rewardModel.findByIdAndRemove(id).exec();
  }

  async linkRewardToEvent(rewardId: string, eventId: string): Promise<Reward> {
    return this.rewardModel.findByIdAndUpdate(rewardId, { $set: { event: new Types.ObjectId(eventId) } }, { new: true }).exec();
  }
}