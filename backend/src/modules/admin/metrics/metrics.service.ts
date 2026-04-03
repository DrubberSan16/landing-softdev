import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { DailyMetricsQueryDto } from './dto/metrics-query.dto';

@Injectable()
export class MetricsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getSiteMetrics() {
    const summary = await this.databaseService.one(
      `
        SELECT
          total_unique_visitors_site AS "totalUniqueVisitorsSite",
          total_sessions_site AS "totalSessionsSite",
          total_page_views_site AS "totalPageViewsSite",
          total_demo_clicks_site AS "totalDemoClicksSite",
          total_contact_requests_site AS "totalContactRequestsSite"
        FROM landing_core.vw_site_metrics
      `,
    );

    const totals = await this.databaseService.one(
      `
        SELECT
          COUNT(*) FILTER (WHERE status = 'published' AND visibility = 'public' AND deleted_at IS NULL)::int AS "publishedProjects",
          COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS "totalProjects"
        FROM landing_core.tb_projects
      `,
    );

    return {
      ...summary,
      ...totals,
    };
  }

  async getProjectMetrics() {
    return this.databaseService.query(
      `
        SELECT
          p.project_id AS "projectId",
          tp.public_id AS "projectPublicId",
          p.title,
          p.slug,
          p.total_project_views AS "totalProjectViews",
          p.total_demo_clicks AS "totalDemoClicks",
          p.total_unique_visitors AS "totalUniqueVisitors",
          p.total_contact_requests AS "totalContactRequests",
          p.total_demo_access_rows AS "totalDemoAccessRows",
          p.total_leads_rows AS "totalLeadsRows",
          CASE
            WHEN p.total_project_views > 0
              THEN ROUND((p.total_contact_requests::numeric / p.total_project_views::numeric) * 100, 2)
            ELSE 0
          END AS "conversionRate"
        FROM landing_core.vw_project_metrics p
        JOIN landing_core.tb_projects tp
          ON tp.id = p.project_id
        ORDER BY p.total_project_views DESC, p.title ASC
      `,
    );
  }

  async getTopDemoClicks() {
    return this.databaseService.query(
      `
        SELECT
          td.project_id AS "projectId",
          tp.public_id AS "projectPublicId",
          td.title,
          td.slug,
          td.total_clicks AS "totalClicks"
        FROM landing_core.vw_top_demo_clicks td
        JOIN landing_core.tb_projects tp
          ON tp.id = td.project_id
        LIMIT 10
      `,
    );
  }

  async getDailyDemoClicks(query: DailyMetricsQueryDto) {
    const filters: string[] = ['1 = 1'];
    const values: unknown[] = [];

    if (query.projectPublicId) {
      values.push(query.projectPublicId);
      filters.push(`p.public_id = $${values.length}::uuid`);
    }

    if (query.from) {
      values.push(query.from);
      filters.push(`vw.access_date >= $${values.length}::date`);
    }

    if (query.to) {
      values.push(query.to);
      filters.push(`vw.access_date <= $${values.length}::date`);
    }

    return this.databaseService.query(
      `
        SELECT
          vw.project_id AS "projectId",
          p.public_id AS "projectPublicId",
          vw.title,
          vw.access_date AS "accessDate",
          vw.total_clicks AS "totalClicks"
        FROM landing_core.vw_daily_project_demo_accesses vw
        JOIN landing_core.tb_projects p
          ON p.id = vw.project_id
        WHERE ${filters.join(' AND ')}
        ORDER BY vw.access_date DESC, vw.total_clicks DESC
      `,
      values,
    );
  }
}
