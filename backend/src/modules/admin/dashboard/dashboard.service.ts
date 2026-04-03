import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';

@Injectable()
export class DashboardService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getSummary() {
    const [siteMetrics, topProjects, recentLeads, pendingNotifications] =
      await Promise.all([
        this.databaseService.one(
          `
          SELECT
            total_unique_visitors_site AS "totalUniqueVisitorsSite",
            total_sessions_site AS "totalSessionsSite",
            total_page_views_site AS "totalPageViewsSite",
            total_demo_clicks_site AS "totalDemoClicksSite",
            total_contact_requests_site AS "totalContactRequestsSite"
          FROM landing_core.vw_site_metrics
        `,
        ),
        this.databaseService.query(
          `
          SELECT
            p.public_id AS "projectPublicId",
            p.title,
            p.slug,
            p.total_project_views AS "totalProjectViews",
            p.total_demo_clicks AS "totalDemoClicks",
            p.total_contact_requests AS "totalContactRequests"
          FROM landing_core.tb_projects p
          WHERE p.deleted_at IS NULL
          ORDER BY p.total_project_views DESC, p.total_demo_clicks DESC
          LIMIT 5
        `,
        ),
        this.databaseService.query(
          `
          SELECT
            cr.public_id AS "publicId",
            cr.full_name AS "fullName",
            cr.email::varchar AS email,
            cr.subject,
            cr.status,
            cr.created_at AS "createdAt",
            p.public_id AS "projectPublicId",
            p.title AS "projectTitle"
          FROM landing_core.tb_contact_requests cr
          LEFT JOIN landing_core.tb_projects p
            ON p.id = cr.project_id
          ORDER BY cr.created_at DESC
          LIMIT 5
        `,
        ),
        this.databaseService.one(
          `
          SELECT
            COUNT(*) FILTER (WHERE status = 'pending')::int AS "pending",
            COUNT(*) FILTER (WHERE status = 'failed')::int AS "failed",
            COUNT(*) FILTER (WHERE status = 'sent')::int AS "sent"
          FROM landing_core.tb_notification_queue
        `,
        ),
      ]);

    return {
      siteMetrics,
      topProjects,
      recentLeads,
      notificationQueue: pendingNotifications,
    };
  }
}
