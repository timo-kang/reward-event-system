import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';

describe('EventService', () => {
  let service: EventService;
  let eventModel: Model<EventDocument>;

  const mockEvent = {
    name: 'Test Event',
    description: 'A test event',
    conditions: {},
    start_date: new Date(),
    end_date: new Date(),
    is_active: true,
  };

  const mockEventModel = {
    new: jest.fn().mockResolvedValue(mockEvent),
    constructor: jest.fn().mockResolvedValue(mockEvent),
    find: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    eventModel = module.get<Model<EventDocument>>(getModelToken(Event.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create a new event', async () => {
      jest.spyOn(eventModel, 'create').mockResolvedValue(mockEvent as any);

      const result = await service.createEvent(mockEvent);
      expect(eventModel.create).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findAllEvents', () => {
    it('should return all events', async () => {
      const eventArray = [mockEvent, { ...mockEvent, name: 'Another Event' }];
      jest.spyOn(eventModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(eventArray),
      } as any);

      const result = await service.findAllEvents();
      expect(eventModel.find).toHaveBeenCalled();
      expect(result).toEqual(eventArray);
    });
  });
});