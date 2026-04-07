import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from './dto/upsert-user.dto';
import { UsersService } from './users.service';
import type { Request } from 'express';

@ApiExcludeController()
@Controller('_internal/admin-users')
export class InternalUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  createInternal(
    @Body() payload: CreateUserDto,
    @Req() request: Request,
  ) {
    return this.usersService.createInternal(payload, request);
  }

  @Patch('update/:publicId')
  updateInternal(
    @Param('publicId') publicId: string,
    @Body() payload: UpdateUserDto,
    @Req() request: Request,
  ) {
    return this.usersService.updateInternal(publicId, payload, request);
  }
}
