import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class DailyMetricsQueryDto {
  @IsOptional()
  @IsUUID()
  projectPublicId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
