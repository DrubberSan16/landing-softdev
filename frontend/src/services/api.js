import { appConfig } from './config'
import { getAdminSessionToken } from '../utils/admin-session'

function buildUrl(path, query = {}) {
  const url = new URL(`${appConfig.apiBaseUrl}${path}`)

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.message || payload?.error || 'No se pudo completar la solicitud.'

    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }

  return payload
}

async function request(path, options = {}, query) {
  const response = await fetch(buildUrl(path, query), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  return parseResponse(response)
}

export const publicApi = {
  getHomeData() {
    return request('/public/home')
  },
  getProjects(query) {
    return request('/public/projects', {}, query)
  },
  getProject(slug) {
    return request(`/public/projects/${slug}`)
  },
  getCategories() {
    return request('/public/categories')
  },
  getTechnologies() {
    return request('/public/technologies')
  },
  createContactRequest(payload) {
    return request('/public/contact-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  trackPageView(payload) {
    return request('/public/analytics/page-views', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  trackDemoClick(payload) {
    return request('/public/analytics/demo-clicks', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

export const adminApi = {
  login(payload) {
    return request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  me() {
    return request('/admin/auth/me', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  logout() {
    return request('/admin/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getDashboardSummary() {
    return request('/admin/dashboard/summary', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getProjects(query) {
    return request(
      '/admin/projects',
      {
        headers: {
          Authorization: `Bearer ${getAdminSessionToken()}`,
        },
      },
      query,
    )
  },
  getCategories() {
    return request('/admin/categories', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getTechnologies() {
    return request('/admin/technologies', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getContacts(query) {
    return request(
      '/admin/contact-requests',
      {
        headers: {
          Authorization: `Bearer ${getAdminSessionToken()}`,
        },
      },
      query,
    )
  },
  getUsers(query) {
    return request(
      '/admin/users',
      {
        headers: {
          Authorization: `Bearer ${getAdminSessionToken()}`,
        },
      },
      query,
    )
  },
  getRoles() {
    return request('/admin/roles', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getPermissions() {
    return request('/admin/roles/permissions', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getSiteMetrics() {
    return request('/admin/metrics/site', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getProjectMetrics() {
    return request('/admin/metrics/projects', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getTopDemoClicks() {
    return request('/admin/metrics/top-demo-clicks', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getNotificationQueue(query) {
    return request(
      '/admin/notifications/queue',
      {
        headers: {
          Authorization: `Bearer ${getAdminSessionToken()}`,
        },
      },
      query,
    )
  },
  getNotificationChannels() {
    return request('/admin/notifications/channels', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getNotificationTemplates() {
    return request('/admin/notifications/templates', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getNotificationPreferences(query) {
    return request(
      '/admin/notifications/preferences',
      {
        headers: {
          Authorization: `Bearer ${getAdminSessionToken()}`,
        },
      },
      query,
    )
  },
  getAuditLogs(query) {
    return request(
      '/admin/audit-logs',
      {
        headers: {
          Authorization: `Bearer ${getAdminSessionToken()}`,
        },
      },
      query,
    )
  },
}

export function buildDemoRedirectUrl(slug, sessionToken, referrerUrl) {
  return buildUrl(`/public/projects/${slug}/demo-redirect`, {
    sessionToken,
    referrerUrl,
  })
}
