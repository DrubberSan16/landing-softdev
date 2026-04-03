import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Admin' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Principal' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'admin@tuempresa.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+593999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: 'MiClaveSegura123' })
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  password: string;

  @ApiPropertyOptional({ example: 'https://cdn.tuempresa.com/avatar.png' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: ['SUPER_ADMIN', 'ADMIN'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateUserRolesDto {
  @ApiProperty({ example: ['EDITOR', 'ANALYST'] })
  @IsArray()
  @IsString({ each: true })
  roleCodes: string[];
}
