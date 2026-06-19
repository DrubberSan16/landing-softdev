import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'COMMERCIAL' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Equipo comercial' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionCodes?: string[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
