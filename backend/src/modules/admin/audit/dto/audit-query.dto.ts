import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class AuditQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  adminUserPublicId?: string;

  @IsOptional()
  @IsString()
  actionCode?: string;

  @IsOptional()
  @IsString()
  entityName?: string;
}
