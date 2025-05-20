import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reward, RewardDocument } from './schemas/reward.schema';
import { CreateRewardDto } from './dto/create-reward.dto';
import { Event, EventDocument } from './schemas/event.schema';

@Injectable()
export class RewardService {
  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async create(eventId: string, createRewardDto: CreateRewardDto): Promise<RewardDocument> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.is_active) {
      throw new BadRequestException('Event is not active');
    }

    const createdReward = new this.rewardModel({
      ...createRewardDto,
      event: eventId,
    });
    return createdReward.save();
  }

  async findByEvent(eventId: string): Promise<RewardDocument[]> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return this.rewardModel.find({ event: eventId }).exec();
  }

  async findById(id: string): Promise<RewardDocument> {
    const reward = await this.rewardModel.findById(id).exec();
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    return reward;
  }

  async update(id: string, updateRewardDto: Partial<CreateRewardDto>): Promise<RewardDocument> {
    const updatedReward = await this.rewardModel
      .findByIdAndUpdate(id, updateRewardDto, { new: true })
      .exec();
    if (!updatedReward) {
      throw new NotFoundException('Reward not found');
    }
    return updatedReward;
  }

  async remove(id: string): Promise<void> {
    const result = await this.rewardModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Reward not found');
    }
  }
}