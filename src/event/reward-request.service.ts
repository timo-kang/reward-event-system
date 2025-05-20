import { ConflictException, ForbiddenException, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RewardRequest, RewardRequestDocument } from './schemas/reward-request.schema';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { Reward, RewardDocument } from './schemas/reward.schema';
import { RewardService } from './reward.service';
import { UserActivityService } from '../auth/user-activity.service';

export enum RewardRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
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

        const event = await this.eventModel.findById(eventId).exec();
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (!event.is_active) {
            throw new ForbiddenException('Event is not active');
        }

        const reward = await this.rewardService.findById(rewardId);
        if (!reward) {
            throw new NotFoundException('Reward not found');
        }

        const existingRequest = await this.rewardRequestModel.findOne({
            user: userId,
            event: eventId,
            status: { $ne: RewardRequestStatus.REJECTED }
        }).exec();

        if (existingRequest) {
            throw new ConflictException('Reward request for this event already exists for the user');
        }

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
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('Invalid user ID');
        }
        return this.rewardRequestModel.find({ user: userId }).exec();
    }

    async findByEvent(eventId: string): Promise<RewardRequestDocument[]> {
        if (!Types.ObjectId.isValid(eventId)) {
            throw new BadRequestException('Invalid event ID');
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
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid request ID');
        }

        if (!Object.values(RewardRequestStatus).includes(status)) {
            throw new BadRequestException('Invalid status');
        }

        const updatedRequest = await this.rewardRequestModel
            .findByIdAndUpdate(id, { status }, { new: true })
            .exec();

        if (!updatedRequest) {
            throw new NotFoundException('Reward request not found');
        }

        return updatedRequest;
    }

    async remove(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid request ID');
        }
        const result = await this.rewardRequestModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException('Reward request not found');
        }
    }

    private async validateConditions(eventId: string, userId: string): Promise<boolean> {
        const event = await this.eventModel.findById(eventId).exec();
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (!event.conditions) {
            return true;
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