import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateContactDto {
  @ApiPropertyOptional({ example: 'contacted' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsOptional()
  @IsUUID()
  assignedToPublicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  adminNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  firstResponseAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closedAt?: string;
}
