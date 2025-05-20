import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../shared/auth';

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  username: string;
  password: string;
  role: UserRole;
  points: number;
  consecutive_logins: number;
  last_login_date?: Date;
  invited_friends_count: number;
  invited_friends: Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ required: true, default: 0 })
  points!: number;

  @Prop({ required: true, default: 0 })
  consecutive_logins!: number;

  @Prop()
  last_login_date?: Date;

  @Prop({ required: true, default: 0 })
  invited_friends_count!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  invited_friends!: Types.ObjectId[];

  @Prop({ required: true, default: Date.now })
  created_at!: Date;

  @Prop({ required: true, default: Date.now })
  updated_at!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);