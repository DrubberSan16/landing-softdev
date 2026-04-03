import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { ContactsController } from './contacts/contacts.controller';
import { ContactsService } from './contacts/contacts.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';
import { TechnologiesController } from './technologies/technologies.controller';
import { TechnologiesService } from './technologies/technologies.service';
import { AuditController } from './audit/audit.controller';
import { AuditService } from './audit/audit.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { SessionAuthGuard } from './auth/session-auth.guard';

@Module({
  controllers: [
    AuthController,
    DashboardController,
    CategoriesController,
    TechnologiesController,
    ProjectsController,
    ContactsController,
    UsersController,
    RolesController,
    NotificationsController,
    MetricsController,
    AuditController,
  ],
  providers: [
    AuthService,
    SessionAuthGuard,
    CategoriesService,
    TechnologiesService,
    ProjectsService,
    ContactsService,
    UsersService,
    RolesService,
    NotificationsService,
    MetricsService,
    DashboardService,
    AuditService,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AdminModule {}
