import { IsString, IsNotEmpty, IsOptional, IsDate, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  start_date?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  end_date?: Date;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}