const ADMIN_SESSION_KEY = 'landing-softdev-admin-session'

export function getAdminSessionToken() {
  return localStorage.getItem(ADMIN_SESSION_KEY) || ''
}

export function setAdminSessionToken(token) {
  localStorage.setItem(ADMIN_SESSION_KEY, token)
}

export function clearAdminSessionToken() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}
