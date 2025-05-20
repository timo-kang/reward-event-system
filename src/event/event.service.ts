import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<EventDocument> {
    try {
      const createdEvent = new this.eventModel(createEventDto);
      // const createdEvent = await this.eventModel.create(createEventDto);
      return await createdEvent.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestException('Event with this name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<EventDocument[]> {
    return this.eventModel.find().exec();
  }

  async findActiveEvents(): Promise<EventDocument[]> {
    return this.eventModel.find({ is_active: true }).exec();
  }

  async findById(id: string): Promise<EventDocument | null> {
    return this.eventModel.findById(id).exec();
  }

  async updateEventStatus(id: string, isActive: boolean): Promise<EventDocument> {
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, { is_active: isActive }, { new: true })
      .exec();
    if (!updatedEvent) {
      throw new NotFoundException('Event not found');
    }
    return updatedEvent;
  }

  async update(id: string, updateEventDto: Partial<CreateEventDto>): Promise<EventDocument> {
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .exec();
    if (!updatedEvent) {
      throw new NotFoundException('Event not found');
    }
    return updatedEvent;
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Event not found');
    }
  }
}