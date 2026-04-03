import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class TrackPageViewDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  anonymousId: string;

  @ApiProperty({ example: 'd29b7ed7-8ab6-4e8b-9913-f0d95a6ef3c5' })
  @IsUUID()
  sessionToken: string;

  @ApiProperty({ example: '/proyectos/demo-erp-comercial' })
  @IsString()
  @MaxLength(500)
  path: string;

  @ApiProperty({ example: 'project_detail' })
  @IsString()
  pageType: string;

  @ApiPropertyOptional({ example: 'project-detail' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  routeName?: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsOptional()
  @IsUUID()
  projectPublicId?: string;

  @ApiPropertyOptional({ example: 'demo-erp-comercial' })
  @IsOptional()
  @IsString()
  projectSlug?: string;

  @ApiPropertyOptional({ example: 'https://google.com' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  referrerUrl?: string;

  @ApiPropertyOptional({ example: 'desktop' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  deviceType?: string;

  @ApiPropertyOptional({ example: 'Chrome' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  browserName?: string;

  @ApiPropertyOptional({ example: 'Windows' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  osName?: string;

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 'EC' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  countryCode?: string;

  @ApiPropertyOptional({ example: 'Guayaquil' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cityName?: string;
}
