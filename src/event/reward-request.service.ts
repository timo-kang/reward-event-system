import { ConflictException, ForbiddenException, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RewardRequest, RewardRequestDocument } from './schemas/reward-request.schema';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { Reward, RewardDocument } from './schemas/reward.schema';
import { RewardService } from './reward.service';
import { UserActivityService } from '../auth/user-activity.service';

export enum RewardRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Injectable()
export class RewardRequestService {
    constructor(
        @InjectModel(RewardRequest.name) private rewardRequestModel: Model<RewardRequestDocument>,
        @InjectModel(Event.name) private eventModel: Model<EventDocument>,
        @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
        private userActivityService: UserActivityService,
        private rewardService: RewardService,
    ) {}

    async create(eventId: string, createRewardRequestDto: CreateRewardRequestDto): Promise<RewardRequestDocument> {
        const { userId, rewardId } = createRewardRequestDto;

        // 1. Find the associated event
        const event = await this.eventModel.findById(eventId).exec();
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (!event.is_active) {
            throw new ForbiddenException('Event is not active');
        }

        // 2. Fetch reward details to ensure it exists
        const reward = await this.rewardService.findById(rewardId);
        if (!reward) {
            throw new NotFoundException('Reward not found');
        }

        // 3. Check for duplicate requests
        const existingRequest = await this.rewardRequestModel.findOne({
            user: userId,
            event: eventId,
            status: { $ne: RewardRequestStatus.REJECTED }
        }).exec();

        if (existingRequest) {
            throw new ConflictException('Reward request for this event already exists for the user');
        }

        // 4. Create the reward request
        const createdRewardRequest = new this.rewardRequestModel({
            user: userId,
            event: eventId,
            reward: rewardId,
            request_date: new Date(),
            status: RewardRequestStatus.PENDING,
        });

        return createdRewardRequest.save();
    }

    async findByUser(userId: string): Promise<RewardRequestDocument[]> {
        return this.rewardRequestModel.find({ user: userId }).exec();
    }

    async findByEvent(eventId: string): Promise<RewardRequestDocument[]> {
        const event = await this.eventModel.findById(eventId).exec();
        if (!event) {
            throw new NotFoundException('Event not found');
        }
        return this.rewardRequestModel.find({ event: eventId }).exec();
    }

    async findByStatus(status: RewardRequestStatus): Promise<RewardRequestDocument[]> {
        return this.rewardRequestModel.find({ status }).exec();
    }

    async findById(id: string): Promise<RewardRequestDocument | null> {
        return this.rewardRequestModel.findById(id).exec();
    }

    async updateStatus(id: string, status: RewardRequestStatus): Promise<RewardRequestDocument> {
        if (!Object.values(RewardRequestStatus).includes(status)) {
            throw new BadRequestException('Invalid status');
        }

        const rewardRequest = await this.rewardRequestModel.findById(id).exec();
        if (!rewardRequest) {
            throw new NotFoundException('Reward request not found');
        }

        const updatedRequest = await this.rewardRequestModel
            .findByIdAndUpdate(id, { status }, { new: true })
            .exec();

        if (!updatedRequest) {
            throw new Error('Failed to update reward request');
        }

        return updatedRequest;
    }

    async remove(id: string): Promise<void> {
        const result = await this.rewardRequestModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException('Reward request not found');
        }
    }

    private async validateConditions(eventId: string, userId: string): Promise<boolean> {
        const event = await this.eventModel.findById(eventId).exec();
        if (!event || !event.conditions) {
            return true; // No conditions means everyone is eligible
        }

        const conditions = event.conditions as any[];

        for (const condition of conditions) {
            switch (condition.type) {
                case 'minimumPoints':
                    const userPoints = await this.userActivityService.getUserPoints(userId);
                    if (userPoints < condition.value) {
                        return false;
                    }
                    break;
                case 'consecutiveLogins':
                    const consecutiveLogins = await this.userActivityService.getUserConsecutiveLogins(userId);
                    if (consecutiveLogins < condition.value) {
                        return false;
                    }
                    break;
                case 'invitedFriends':
                    const invitedFriends = await this.userActivityService.getUserInvitedFriendsCount(userId);
                    if (invitedFriends < condition.value) {
                        return false;
                    }
                    break;
                default:
                    console.warn(`Unknown condition type: ${condition.type}`);
                    break;
            }
        }

        return true;
    }
}

// TODO: Uncomment and import if you are injecting these models
// import { Event } from './schemas/event.schema';
// import { Reward } from './schemas/reward.schema';