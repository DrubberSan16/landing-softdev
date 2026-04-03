import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTechnologyDto {
  @ApiProperty({ example: 'Vue 3' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'vue-3' })
  @IsString()
  @MaxLength(120)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'mdi-vuejs' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  icon?: string;

  @ApiPropertyOptional({ example: 'https://vuejs.org' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  officialUrl?: string;

  @ApiPropertyOptional({ example: '#42B883' })
  @IsOptional()
  @Matches(/^#[A-Fa-f0-9]{6}$/)
  colorHex?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  status?: boolean;
}

export class UpdateTechnologyDto extends PartialType(CreateTechnologyDto) {}

export class TechnologyListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  status?: boolean;
}
