import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface EventCondition {
  type: 'minimumPoints' | 'consecutiveLogins' | 'invitedFriends';
  value: number;
  description: string;
}

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  is_active!: boolean;

  @Prop({ required: true })
  start_date!: Date;

  @Prop({ required: true })
  end_date!: Date;

  @Prop({ type: [{ type: Object }] })
  conditions!: EventCondition[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Reward' }] })
  rewards!: Types.ObjectId[];

  createdAt!: Date;
  updatedAt!: Date;
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);