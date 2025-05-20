import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>
  ) {}


  async create(createEventDto: CreateEventDto): Promise<EventDocument> {
    if (!createEventDto.name || createEventDto.name.trim() === '') {
      throw new BadRequestException('Event name cannot be empty');
    }
    if (createEventDto.start_date && createEventDto.end_date) {
      if (createEventDto.start_date >= createEventDto.end_date) {
        throw new BadRequestException("Start date must be before end date");
      }
    }

    // Convert conditions object to array if it's not already
    const conditions = createEventDto.conditions 
      ? Array.isArray(createEventDto.conditions) 
        ? createEventDto.conditions 
        : [createEventDto.conditions]
      : [];

    if (conditions.length === 0) {
      throw new BadRequestException('Event must have at least one condition');
    }

    const newEvent = new this.eventModel({
      ...createEventDto,
      conditions,
      is_active: createEventDto.is_active ?? true, // Default to true for testing
    });
    return newEvent.save();
  }

  async findAll(): Promise<EventDocument[]> {
    return this.eventModel.find().exec();
  }

  async findActiveEvents(): Promise<EventDocument[]> {
    return this.eventModel.find({ is_active: true }).exec();
  }

  async findById(id: string): Promise<EventDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid event ID');
    }
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    return event;
  }

  async updateEventStatus(
    id: string,
    isActive: boolean
  ): Promise<EventDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid event ID');
    }
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, { is_active: isActive }, { new: true })
      .exec();
    if (!updatedEvent) {
      throw new NotFoundException("Event not found");
    }
    return updatedEvent;
  }

  async update(
    id: string,
    updateEventDto: Partial<CreateEventDto>
  ): Promise<EventDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid event ID');
    }
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .exec();
    if (!updatedEvent) {
      throw new NotFoundException("Event not found");
    }
    return updatedEvent;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid event ID');
    }
    const result = await this.eventModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException("Event not found");
    }
  }
}