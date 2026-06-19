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
  const { headers: optionHeaders = {}, ...requestOptions } = options
  const isFormData = options.body instanceof FormData
  const response = await fetch(buildUrl(path, query), {
    ...requestOptions,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...optionHeaders,
    },
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
  createProject(payload) {
    return request('/admin/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  uploadProjectCover(file) {
    const body = new FormData()
    body.append('image', file)

    return request('/admin/projects/uploads/cover', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body,
    })
  },
  updateProject(publicId, payload) {
    return request(`/admin/projects/${publicId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  deleteProject(publicId) {
    return request(`/admin/projects/${publicId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  getCategories() {
    return request('/admin/categories', {
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
  },
  createCategory(payload) {
    return request('/admin/categories', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  updateCategory(publicId, payload) {
    return request(`/admin/categories/${publicId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  deleteCategory(publicId) {
    return request(`/admin/categories/${publicId}`, {
      method: 'DELETE',
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
  createTechnology(payload) {
    return request('/admin/technologies', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  updateTechnology(publicId, payload) {
    return request(`/admin/technologies/${publicId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  deleteTechnology(publicId) {
    return request(`/admin/technologies/${publicId}`, {
      method: 'DELETE',
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
  updateContact(publicId, payload) {
    return request(`/admin/contact-requests/${publicId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  deleteContact(publicId) {
    return request(`/admin/contact-requests/${publicId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
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
  createUser(payload) {
    return request('/admin/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  updateUser(publicId, payload) {
    return request(`/admin/users/${publicId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  deleteUser(publicId) {
    return request(`/admin/users/${publicId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
    })
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
  createRole(payload) {
    return request('/admin/roles', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  updateRole(code, payload) {
    return request(`/admin/roles/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  deleteRole(code) {
    return request(`/admin/roles/${encodeURIComponent(code)}`, {
      method: 'DELETE',
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
  createNotificationChannel(payload) {
    return request('/admin/notifications/channels', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  updateNotificationChannel(id, payload) {
    return request(`/admin/notifications/channels/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  deleteNotificationChannel(id) {
    return request(`/admin/notifications/channels/${id}`, {
      method: 'DELETE',
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
  createNotificationTemplate(payload) {
    return request('/admin/notifications/templates', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  updateNotificationTemplate(id, payload) {
    return request(`/admin/notifications/templates/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  deleteNotificationTemplate(id) {
    return request(`/admin/notifications/templates/${id}`, {
      method: 'DELETE',
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
  updateNotificationQueue(id, payload) {
    return request(`/admin/notifications/queue/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
  },
  updateNotificationPreference(id, payload) {
    return request(`/admin/notifications/preferences/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAdminSessionToken()}`,
      },
      body: JSON.stringify(payload),
    })
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
