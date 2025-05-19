import { Controller, Post, Get, Body, Param, Put } from '@nestjs/common';
import { EventService } from './event.service';
import { RewardService } from './reward.service';
import { RewardRequestService } from './reward-request.service';


@Controller('event')
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Post()
    createEvent(@Body() createEventDto: any) {
        return this.eventService.createEvent(createEventDto);
    }

    @Get()
    findAllEvents() {
        return this.eventService.findAllEvents();
    }

    @Post(':eventId/rewards')
    createReward(@Param('eventId') eventId: string, @Body() createRewardDto: any) {
        return this.rewardService.createReward(eventId, createRewardDto);
    }

    @Get(':eventId/rewards')
    findRewardsByEvent(@Param('eventId') eventId: string) {
        return this.rewardService.findRewardsByEvent(eventId);
    }

 @Post(':eventId/rewards/:rewardId/request')
  createRewardRequest(@Param('eventId') eventId: string, @Param('rewardId') rewardId: string, @Body() body: { userId: string }) {
    return this.rewardRequestService.createRewardRequest(body.userId, eventId, rewardId);
  }

  @Get(':eventId/requests')
  findRewardRequestsByEvent(@Param('eventId') eventId: string) {
    return this.rewardRequestService.findRewardRequestsByEvent(eventId);
  }
}

@Controller('requests')
export class RewardRequestController {
    constructor(private readonly rewardRequestService: RewardRequestService) {}

    @Put(':requestId/status')
    updateRewardRequestStatus(@Param('requestId') requestId: string, @Body('status') status: string) {
        return this.rewardRequestService.updateRewardRequestStatus(requestId, status);
    }
}
