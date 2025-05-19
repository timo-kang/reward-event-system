import { ConflictException, ForbiddenException, Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RewardRequest, RewardRequestDocument } from './schemas/reward-request.schema';
import { Event, EventDocument } from './schemas/event.schema'; // Assuming you might need Event document here
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { Reward, RewardDocument } from './schemas/reward.schema';
import { AuthService } from '../auth/auth.service';
import { RewardService } from './reward.service'; // Assuming RewardService is in the same module

@Injectable()
export class RewardRequestService {
    constructor(
        @InjectModel(RewardRequest.name) private rewardRequestModel: Model<RewardRequestDocument>,
        @InjectModel(Event.name) private eventModel: Model<EventDocument>, // Inject Event model if needed
        @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>, // Inject Reward model if needed
        private authService: AuthService,
        private rewardService: RewardService,
    ) {
    }

    async create(createRewardRequestDto: CreateRewardRequestDto): Promise<RewardRequest> {
        const {userId, eventId, rewardId} = createRewardRequestDto;

        // 1. Find the associated event
        const event = await this.eventModel.findById(eventId).exec();
        if (!event) {
            throw new ConflictException('Event not found');
        }

        // Fetch reward details to ensure it exists
        const reward = await this.rewardService.findById(rewardId);
        if (!reward) {
            throw new ConflictException('Reward not found');
        }

        // 2. Implement the logic to validate if the user has met the conditions for the event
        const meetsConditions = await this.validateConditions(eventId, userId);
        if (!meetsConditions) {
            throw new ForbiddenException('User does not meet the conditions for this event');
        }

        // 3. Check if a reward request for this event and user already exists.
        // Check for duplicate requests
        const existingRequest = await this.rewardRequestModel.findOne({
            user: userId,
            event: eventId,
            status: {$ne: 'rejected'}
        }).exec();
        if (existingRequest) {
            throw new BadRequestException('Reward request for this event already exists for the user');
        }
        const createdRewardRequest = new this.rewardRequestModel({
            user: userId,
            event: eventId,
            reward: rewardId,
            request_date: new Date(),
            status: 'pending', // Initial status
        });

        return createdRewardRequest.save();
    }

    async findByUser(userId: string): Promise<RewardRequest[]> {
        return this.rewardRequestModel.find({user: userId}).exec();
    }

    async findByEvent(eventId: string): Promise<RewardRequest[]> {
        return this.rewardRequestModel.find({event: eventId}).exec();
    }

    async findByStatus(status: string): Promise<RewardRequest[]> {
        return this.rewardRequestModel.find({status}).exec();
    }

    async updateStatus(requestId: string, status: string): Promise<RewardRequest | null> {
        const rewardRequest = await this.rewardRequestModel.findById(requestId).exec();
        if (!rewardRequest) {
            return null;
        }
        rewardRequest.status = status;
        return rewardRequest.save();
    }

    async findRewardRequestsByEvent(eventId: string): Promise<RewardRequest[]> {
        return this.rewardRequestModel.find({event: eventId}).exec();
    }

    async updateRewardRequestStatus(requestId: string, status: string): Promise<RewardRequest | null> {
        return this.rewardRequestModel.findByIdAndUpdate(requestId, {status}, {new: true}).exec();
    }

    // TODO: Add more methods as needed, e.g., finding requests by user, approving/rejecting requests with condition validation, etc.

    private async validateConditions(eventId: string, userId: string): Promise<boolean> {
        const event = await this.eventModel.findById(eventId).exec();
        if (!event || !event.conditions) {
            // No specific conditions defined for this event
            return false;
        }

        // Assuming event.conditions is stored as an object or can be parsed into one
        const conditions = event.conditions as any[]; // Assuming conditions is an array of objects

        for (const condition of conditions) {
            switch (condition.type) {
                case 'minimumPoints':
                    const userPoints = await this.authService.getUserPoints(userId);
                    if (userPoints < condition.value) {
                        return false;
                    }
                    break;
                case 'consecutiveLogins':
                    const consecutiveLogins = await this.authService.getUserConsecutiveLogins(userId);
                    if (consecutiveLogins < condition.value) {
                        return false;
                    }
                    break;
                case 'invitedFriends':
                    const invitedFriends = await this.authService.getUserInvitedFriendsCount(userId);
                    if (invitedFriends < condition.value) {
                        return false;
                    }
                    break;
                // Add more condition types as needed
                default:
                    // Optionally handle unknown condition types, maybe log a warning
                    break;
            }
        }
        // If all conditions are met
        return true;
    }
}

// TODO: Uncomment and import if you are injecting these models
// import { Event } from './schemas/event.schema';
// import { Reward } from './schemas/reward.schema';