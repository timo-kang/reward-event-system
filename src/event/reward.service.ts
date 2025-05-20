import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reward, RewardDocument } from './schemas/reward.schema';
import { CreateRewardDto } from './dto/create-reward.dto';

@Injectable()
export class RewardService {
  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
  ) {}

  async create(eventId: string, createRewardDto: CreateRewardDto): Promise<RewardDocument> {
    const createdReward = await this.rewardModel.create({
      ...createRewardDto,
      eventId,
    });
    return createdReward.save();
  }

  async findByEvent(eventId: string): Promise<RewardDocument[]> {
    return this.rewardModel.find({ eventId }).exec();
  }

  async findById(id: string): Promise<RewardDocument | null> {
    return this.rewardModel.findById(id).exec();
  }

  async update(id: string, updateRewardDto: Partial<CreateRewardDto>): Promise<RewardDocument | null> {
    const updatedReward = await this.rewardModel
      .findByIdAndUpdate(id, updateRewardDto, { new: true })
      .exec();
    if (!updatedReward) {
      throw new NotFoundException('Reward not found');
    }
    return updatedReward;
  }

  async remove(id: string): Promise<void> {
    const result = await this.rewardModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Reward not found');
    }
  }
}