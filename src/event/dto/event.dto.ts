import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class EventDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: Date;

  @IsString()
  @IsNotEmpty()
  location!: string;
}