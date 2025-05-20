import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../shared/auth/auth.types';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: [String], enum: UserRole, default: [UserRole.USER] })
  roles!: UserRole[];

  @Prop({ default: 0 })
  points!: number;

  @Prop({ type: [Date], default: [] })
  loginHistory!: Date[];

  @Prop({ default: 0 })
  invitedFriendsCount!: number;

  @Prop()
  lastLoginDate?: Date;

  @Prop({ default: 0 })
  consecutiveLogins!: number;
}

export const UserSchema = SchemaFactory.createForClass(User);