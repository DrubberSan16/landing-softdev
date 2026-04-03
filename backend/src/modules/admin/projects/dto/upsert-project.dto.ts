import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertProjectDto {
  @ApiProperty({ example: 'Demo ERP Comercial' })
  @IsString()
  @MaxLength(180)
  title: string;

  @ApiProperty({ example: 'demo-erp-comercial' })
  @IsString()
  @MaxLength(200)
  slug: string;

  @ApiProperty({
    example: 'Demo funcional de ERP para ventas, inventario y reportes.',
  })
  @IsString()
  @MaxLength(300)
  shortDescription: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  clientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  businessSector?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  demoSchemaName?: string;

  @ApiProperty({ example: 'https://demos.tuempresa.com/erp-comercial' })
  @IsUrl({ require_protocol: true })
  demoUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  repositoryUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  documentationUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  versionLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: 'draft' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'public' })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryPublicId?: string;

  @ApiPropertyOptional({ example: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  technologyPublicIds?: string[];
}

export class CreateProjectDto extends UpsertProjectDto {}
export class UpdateProjectDto extends PartialType(UpsertProjectDto) {}
