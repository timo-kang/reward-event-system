import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RewardRequestDocument = RewardRequest & Document;

@Schema()
export class RewardRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reward', required: true })
  reward: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  request_date: Date;

  @Prop({ type: String, default: 'pending' })
  status: string;
}

export const RewardRequestSchema = SchemaFactory.createForClass(RewardRequest);