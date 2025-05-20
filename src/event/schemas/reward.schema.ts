import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RewardType {
  POINTS = 'POINTS',
  ITEM = 'ITEM',
  COUPON = 'COUPON',
}

@Schema({ timestamps: true })
export class Reward extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: RewardType })
  type!: RewardType;

  @Prop({ required: true })
  value!: number;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event!: Types.ObjectId;

  @Prop({ required: true, default: true })
  is_active!: boolean;

  @Prop({ required: true, default: Date.now })
  created_at!: Date;

  @Prop({ required: true, default: Date.now })
  updated_at!: Date;
}

export type RewardDocument = Reward & Document;
export const RewardSchema = SchemaFactory.createForClass(Reward);