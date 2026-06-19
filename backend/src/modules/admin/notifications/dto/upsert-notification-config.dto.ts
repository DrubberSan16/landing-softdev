import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNotificationChannelDto {
  @ApiProperty({ example: 'email' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Correo electronico' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateNotificationChannelDto extends PartialType(
  CreateNotificationChannelDto,
) {}

export class CreateNotificationTemplateDto {
  @ApiProperty({ example: 'contact.created' })
  @IsString()
  @MaxLength(60)
  eventCode: string;

  @ApiProperty({ example: 'email' })
  @IsString()
  @MaxLength(30)
  channelCode: string;

  @ApiProperty({ example: 'Nuevo contacto' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectTemplate?: string;

  @ApiProperty()
  @IsString()
  bodyTemplate: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateNotificationTemplateDto extends PartialType(
  CreateNotificationTemplateDto,
) {}
