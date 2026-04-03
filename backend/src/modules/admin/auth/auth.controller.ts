import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdminUser } from '../../../common/decorators/current-admin.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SessionAuthGuard } from './session-auth.guard';
import type { Request } from 'express';
import type { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion administrativa' })
  login(@Body() payload: LoginDto, @Req() request: Request) {
    return this.authService.login(payload, request);
  }

  @Get('me')
  @ApiBearerAuth('session-token')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Obtener el perfil administrativo actual' })
  me(@CurrentAdminUser() admin: CurrentAdmin) {
    return admin;
  }

  @Post('logout')
  @ApiBearerAuth('session-token')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Cerrar sesion administrativa' })
  logout(@Req() request: Request) {
    const token =
      request.headers.authorization?.replace(/^Bearer\s+/i, '').trim() ?? '';
    return this.authService.logout(token, request);
  }
}
