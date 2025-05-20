import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RewardRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class RewardRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reward', required: true })
  reward!: Types.ObjectId;

  @Prop({ required: true, enum: RewardRequestStatus, default: RewardRequestStatus.PENDING })
  status!: RewardRequestStatus;

  @Prop()
  rejection_reason?: string;

  @Prop()
  failure_reason?: string;

  @Prop({ required: true, default: Date.now })
  request_date!: Date;

  @Prop()
  processed_date?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export type RewardRequestDocument = RewardRequest & Document;
export const RewardRequestSchema = SchemaFactory.createForClass(RewardRequest);