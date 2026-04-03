import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactRequestDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  fullName: string;

  @ApiPropertyOptional({ example: 'Softdev Corp' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyName?: string;

  @ApiProperty({ example: 'juan@empresa.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+593999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'whatsapp' })
  @IsOptional()
  @IsString()
  preferredContactMethod?: string;

  @ApiProperty({ example: 'Quiero una demo y cotizacion' })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  subject: string;

  @ApiProperty({
    example: 'Busco una solucion parecida al demo ERP para mi empresa.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({ example: '$5k-$10k' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  budgetRange?: string;

  @ApiPropertyOptional({ example: '/proyectos/demo-erp-comercial' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourcePath?: string;

  @ApiPropertyOptional({
    example: 'https://landing.tuempresa.com/proyectos/demo-erp-comercial',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  sourcePageUrl?: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsOptional()
  @IsUUID()
  projectPublicId?: string;

  @ApiPropertyOptional({ example: 'demo-erp-comercial' })
  @IsOptional()
  @IsString()
  projectSlug?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  wantsNotifications?: boolean;
}
