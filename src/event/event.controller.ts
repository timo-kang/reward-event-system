import { Controller, Post, Get, Body, Param, Put, HttpException, HttpStatus, UseGuards, Delete, Headers } from '@nestjs/common';
import { EventService } from './event.service';
import { RewardService } from './reward.service';
import { RewardRequestService } from './reward-request.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '../shared/auth';
import { UserRole } from '../shared/auth';
import { AUTH_ERRORS } from '../shared/auth';
import { CreateRewardDto } from './dto/create-reward.dto';
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { RewardRequestStatus } from './reward-request.service';

@Controller('events')
export class EventController {
    constructor(
        private readonly eventService: EventService,
        private readonly rewardService: RewardService,
        private readonly rewardRequestService: RewardRequestService,
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async createEvent(@Body() createEventDto: CreateEventDto) {
        try {
            return await this.eventService.create(createEventDto);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to create event',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get()
    @Public()
    async getAllEvents() {
        try {
            return await this.eventService.findAll();
        } catch (error) {
            throw new HttpException(
                { message: AUTH_ERRORS.UNAUTHORIZED },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('active')
    @UseGuards(JwtAuthGuard)
    async getActiveEvents() {
        try {
            return await this.eventService.findActiveEvents();
        } catch (error) {
            throw new HttpException(
                'Failed to fetch active events',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get(':id')
    @Public()
    async getEventById(@Param('id') id: string) {
        try {
            const event = await this.eventService.findById(id);
            if (!event) {
                throw new HttpException(
                    { message: 'Event not found' },
                    HttpStatus.NOT_FOUND,
                );
            }
            return event;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                { message: AUTH_ERRORS.UNAUTHORIZED },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateEventStatus(
        @Param('id') id: string,
        @Body('is_active') isActive: boolean,
    ) {
        try {
            return await this.eventService.updateEventStatus(id, isActive);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to update event status',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post(':id/rewards')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async createReward(
        @Param('id') eventId: string,
        @Body() createRewardDto: CreateRewardDto,
    ) {
        try {
            const event = await this.eventService.findById(eventId);
            if (!event) {
                throw new HttpException(
                    { message: 'Event not found' },
                    HttpStatus.NOT_FOUND,
                );
            }
            return await this.rewardService.create(eventId, createRewardDto);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                { message: AUTH_ERRORS.UNAUTHORIZED },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get(':id/rewards')
    @Public()
    async getRewardsByEvent(@Param('id') eventId: string) {
        try {
            const event = await this.eventService.findById(eventId);
            if (!event) {
                throw new HttpException(
                    { message: 'Event not found' },
                    HttpStatus.NOT_FOUND,
                );
            }
            return await this.rewardService.findByEvent(eventId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                { message: AUTH_ERRORS.UNAUTHORIZED },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post(':id/reward-requests')
    @UseGuards(JwtAuthGuard)
    async createRewardRequest(
        @Param('id') eventId: string,
        @Body() createRewardRequestDto: CreateRewardRequestDto,
    ) {
        try {
            const event = await this.eventService.findById(eventId);
            if (!event) {
                throw new HttpException(
                    { message: 'Event not found' },
                    HttpStatus.NOT_FOUND,
                );
            }
            return await this.rewardRequestService.create(eventId, createRewardRequestDto);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                { message: AUTH_ERRORS.UNAUTHORIZED },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get(':id/requests')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async findRewardRequestsByEvent(@Param('id') eventId: string) {
        try {
            return await this.rewardRequestService.findByEvent(eventId);
        } catch (error) {
            throw new HttpException(
                'Failed to fetch reward requests',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put(':id/requests/:requestId/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateRewardRequestStatus(
        @Param('id') eventId: string,
        @Param('requestId') requestId: string,
        @Body('status') status: RewardRequestStatus,
    ) {
        try {
            const event = await this.eventService.findById(eventId);
            if (!event) {
                throw new HttpException(
                    { message: 'Event not found' },
                    HttpStatus.NOT_FOUND,
                );
            }
            return await this.rewardRequestService.updateStatus(requestId, status);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to update reward request status',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}

@Controller('requests')
export class RewardRequestController {
    constructor(private readonly rewardRequestService: RewardRequestService) {}

    @Put(':requestId/status')
    updateRewardRequestStatus(@Param('requestId') requestId: string, @Body('status') status: string) {
        return this.rewardRequestService.updateStatus(requestId, status as RewardRequestStatus);
    }
}
