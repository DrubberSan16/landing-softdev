import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'Landing Softdev API' })
  appName: string;

  @ApiProperty({ example: 'development' })
  environment: string;

  @ApiProperty({ example: 'api' })
  apiPrefix: string;

  @ApiProperty({ example: 'connected' })
  databaseStatus: string;

  @ApiProperty({ example: true })
  databaseSslEnabled: boolean;

  @ApiProperty({ example: '2026-04-03T18:30:00.000Z' })
  timestamp: string;
}
