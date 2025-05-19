import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema()
export class Event {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Object }) // Using Object for flexibility, could be a more specific interface/type
  conditions: any;

  @Prop()
  start_date: Date;

  @Prop()
  end_date: Date;

  @Prop({ default: true })
  is_active: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);