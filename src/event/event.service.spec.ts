import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MockEventModel, createMockEvent } from '../test/mock-models';
import { CreateEventDto } from './dto/create-event.dto';

describe('EventService', () => {
  let service: EventService;
  let eventModel: Model<Event>;

  const TEST_EVENT_ID = '507f1f77bcf86cd799439011';
  const TEST_OPERATOR_ID = '507f1f77bcf86cd799439012';

  const mockEvent = createMockEvent(TEST_EVENT_ID, TEST_OPERATOR_ID);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getModelToken('Event'),
          useValue: MockEventModel,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    eventModel = module.get<Model<Event>>(getModelToken('Event'));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an event successfully', async () => {
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        start_date: new Date('2025-05-20T04:11:27.552Z'),
        end_date: new Date('2025-05-27T04:11:27.552Z'),
        conditions: [
          {
            type: 'minimumPoints',
            value: 100,
            description: 'Minimum points required',
          },
          {
            type: 'consecutiveLogins',
            value: 3,
            description: 'Minimum consecutive logins required',
          },
          {
            type: 'invitedFriends',
            value: 2,
            description: 'Minimum invited friends required',
          },
        ],
        is_active: false,
      };

      const mockEvent = {
        _id: new Types.ObjectId(TEST_EVENT_ID),
        ...createEventDto,
        createdAt: new Date('2025-05-20T06:15:53.199Z'),
        updatedAt: new Date('2025-05-20T06:15:53.199Z'),
      } as EventDocument;

      const newEvent = new MockEventModel(createEventDto);
      newEvent.save = jest.fn().mockResolvedValue(mockEvent);

      const result = await service.create(createEventDto);

      expect(result).toBeDefined();
      expect(result).toMatchObject(createEventDto);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(newEvent.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when start_date is after end_date', async () => {
      const invalidDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        start_date: new Date('2025-05-27T04:11:27.552Z'),
        end_date: new Date('2025-05-20T04:11:27.552Z'),
        conditions: [
          {
            type: 'minimumPoints',
            value: 100,
            description: 'Minimum points required',
          },
        ],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when event name is empty', async () => {
      const invalidDto: CreateEventDto = {
        name: '',
        description: 'Test Description',
        start_date: new Date('2025-05-20T04:11:27.552Z'),
        end_date: new Date('2025-05-27T04:11:27.552Z'),
        conditions: [
          {
            type: 'minimumPoints',
            value: 100,
            description: 'Minimum points required',
          },
        ],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when conditions array is empty', async () => {
      const invalidDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        start_date: new Date('2025-05-20T04:11:27.552Z'),
        end_date: new Date('2025-05-27T04:11:27.552Z'),
        conditions: [],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      const events = [mockEvent];
      MockEventModel.exec.mockResolvedValue(events);

      const result = await service.findAll();

      expect(result).toEqual(events);
      expect(MockEventModel.find).toHaveBeenCalled();
    });

    it('should return empty array when no events exist', async () => {
      MockEventModel.exec.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(MockEventModel.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return an event by id', async () => {
      const mockEvent = createMockEvent(TEST_EVENT_ID);
      MockEventModel.exec.mockResolvedValue(mockEvent);

      const result = await service.findById(TEST_EVENT_ID);

      expect(result).toEqual(mockEvent);
      expect(MockEventModel.findById).toHaveBeenCalledWith(TEST_EVENT_ID);
    });

    it('should throw NotFoundException when event not found', async () => {
      MockEventModel.exec.mockResolvedValue(null);

      await expect(service.findById(TEST_EVENT_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when id is invalid', async () => {
      await expect(service.findById("invalid-id")).rejects.toThrow(
        BadRequestException
      );
      expect(MockEventModel.findById).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an event successfully', async () => {
      const updateEventDto = {
        name: 'Updated Event',
        description: 'Updated Description',
      };

      const updatedEvent = createMockEvent(TEST_EVENT_ID);
      updatedEvent.name = 'Updated Event';
      updatedEvent.description = 'Updated Description';

      MockEventModel.exec.mockResolvedValue(updatedEvent);

      const result = await service.update(TEST_EVENT_ID, updateEventDto);

      expect(result).toEqual(updatedEvent);
      expect(MockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        TEST_EVENT_ID,
        updateEventDto,
        { new: true },
      );
    });

    it('should throw NotFoundException when event not found', async () => {
      const updateEventDto = {
        name: 'Updated Event',
        description: 'Updated Description',
      };

      MockEventModel.exec.mockResolvedValue(null);

      await expect(service.update(TEST_EVENT_ID, updateEventDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when id is invalid', async () => {
      const updateEventDto = {
        name: 'Updated Event',
        description: 'Updated Description',
      };

      await expect(
        service.update("invalid-id", updateEventDto)
      ).rejects.toThrow(BadRequestException);
      expect(MockEventModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('findActiveEvents', () => {
    it('should return only active events', async () => {
      const activeEvents = [
        createMockEvent(TEST_EVENT_ID),
        createMockEvent('507f1f77bcf86cd799439013'),
      ];

      MockEventModel.exec.mockResolvedValue(activeEvents);

      const result = await service.findActiveEvents();

      expect(result).toEqual(activeEvents);
      expect(MockEventModel.find).toHaveBeenCalledWith({ is_active: true });
    });

    it('should return empty array when no active events exist', async () => {
      MockEventModel.exec.mockResolvedValue([]);

      const result = await service.findActiveEvents();

      expect(result).toEqual([]);
      expect(MockEventModel.find).toHaveBeenCalled();
    });
  });

  describe('updateEventStatus', () => {
    it('should update event status successfully', async () => {
      const updatedEvent = createMockEvent(TEST_EVENT_ID);
      updatedEvent.is_active = false;

      MockEventModel.exec.mockResolvedValue(updatedEvent);

      const result = await service.updateEventStatus(TEST_EVENT_ID, false);

      expect(result).toEqual(updatedEvent);
      expect(MockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        TEST_EVENT_ID,
        { is_active: false },
        { new: true },
      );
    });

    it('should throw NotFoundException when event not found', async () => {
      MockEventModel.exec.mockResolvedValue(null);

      await expect(service.updateEventStatus(TEST_EVENT_ID, false))
        .rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when id is invalid", async () => {
      await expect(
        service.updateEventStatus("invalid-id", false)
      ).rejects.toThrow(BadRequestException);
      expect(MockEventModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });
});