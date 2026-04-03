import { ApiProperty } from '@nestjs/swagger';

export class ApiInfoResponseDto {
  @ApiProperty({ example: 'Landing Softdev API' })
  appName: string;

  @ApiProperty({
    example: 'Base API para una landing desacoplada y lista para crecer.',
  })
  description: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({ example: 'api' })
  apiPrefix: string;

  @ApiProperty({ example: '/docs' })
  docsPath: string;

  @ApiProperty({ example: '/api/health' })
  healthPath: string;

  @ApiProperty({ example: '2026-04-03T18:30:00.000Z' })
  timestamp: string;
}
