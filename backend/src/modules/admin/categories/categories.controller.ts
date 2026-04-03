import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdminUser } from '../../../common/decorators/current-admin.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CategoriesService } from './categories.service';
import {
  CategoryListQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/upsert-category.dto';
import type { Request } from 'express';
import type { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';

@ApiTags('Admin Categories')
@ApiBearerAuth('session-token')
@UseGuards(SessionAuthGuard)
@Controller('admin/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions('categories.manage')
  @ApiOperation({ summary: 'Listar categorias administrativas' })
  list(@Query() query: CategoryListQueryDto) {
    return this.categoriesService.list(query);
  }

  @Post()
  @RequirePermissions('categories.manage')
  @ApiOperation({ summary: 'Crear una categoria' })
  create(
    @Body() payload: CreateCategoryDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.categoriesService.create(payload, admin, request);
  }

  @Patch(':publicId')
  @RequirePermissions('categories.manage')
  @ApiOperation({ summary: 'Actualizar una categoria' })
  update(
    @Param('publicId') publicId: string,
    @Body() payload: UpdateCategoryDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.categoriesService.update(publicId, payload, admin, request);
  }
}
