import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { PublicProjectQueryDto } from './dto/public-project-query.dto';
import { TrackDemoClickDto } from './dto/track-demo-click.dto';
import { TrackPageViewDto } from './dto/track-page-view.dto';
import { PublicService } from './public.service';
import type { Request } from 'express';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('home')
  @ApiOperation({ summary: 'Obtener datos base de la landing publica' })
  getHomeData() {
    return this.publicService.getHomeData();
  }

  @Get('projects')
  @ApiOperation({ summary: 'Listar proyectos demo publicados' })
  listProjects(@Query() query: PublicProjectQueryDto) {
    return this.publicService.listProjects(query);
  }

  @Get('projects/:slug')
  @ApiOperation({ summary: 'Obtener detalle publico de un proyecto demo' })
  getProject(@Param('slug') slug: string) {
    return this.publicService.getProjectBySlug(slug);
  }

  @Get('projects/:slug/demo-redirect')
  @Redirect()
  @ApiOperation({
    summary: 'Registrar click al demo y redirigir a la URL configurada',
  })
  async redirectToDemo(
    @Param('slug') slug: string,
    @Query('sessionToken') sessionToken: string,
    @Query('referrerUrl') referrerUrl?: string,
  ) {
    const url = await this.publicService.resolveDemoRedirect(
      slug,
      sessionToken,
      referrerUrl,
    );
    return { url };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias publicas' })
  listCategories() {
    return this.publicService.listCategories();
  }

  @Get('technologies')
  @ApiOperation({ summary: 'Listar tecnologias publicas' })
  listTechnologies() {
    return this.publicService.listTechnologies();
  }

  @Post('contact-requests')
  @ApiOperation({
    summary: 'Registrar una solicitud comercial desde la landing',
  })
  createContactRequest(@Body() payload: CreateContactRequestDto) {
    return this.publicService.createContactRequest(payload);
  }

  @Post('analytics/page-views')
  @ApiOperation({ summary: 'Registrar una vista de pagina del sitio' })
  trackPageView(@Body() payload: TrackPageViewDto, @Req() request: Request) {
    return this.publicService.trackPageView(payload, request);
  }

  @Post('analytics/demo-clicks')
  @ApiOperation({ summary: 'Registrar un click al demo de un proyecto' })
  trackDemoClick(@Body() payload: TrackDemoClickDto) {
    return this.publicService.trackDemoClick(payload);
  }
}
