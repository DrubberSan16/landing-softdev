import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class TrackDemoClickDto {
  @ApiProperty({ example: 'd29b7ed7-8ab6-4e8b-9913-f0d95a6ef3c5' })
  @IsUUID()
  sessionToken: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsOptional()
  @IsUUID()
  projectPublicId?: string;

  @ApiPropertyOptional({ example: 'demo-erp-comercial' })
  @IsOptional()
  @IsString()
  projectSlug?: string;

  @ApiPropertyOptional({
    example: 'https://landing.tuempresa.com/proyectos/demo-erp-comercial',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  referrerUrl?: string;
}
