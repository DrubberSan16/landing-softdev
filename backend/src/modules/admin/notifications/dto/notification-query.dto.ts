import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class NotificationQueueQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  eventCode?: string;

  @IsOptional()
  @IsUUID()
  projectPublicId?: string;
}

export class NotificationPreferenceQueryDto {
  @IsOptional()
  @IsUUID()
  adminUserPublicId?: string;
}
