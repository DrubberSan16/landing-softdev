const ANONYMOUS_KEY = 'landing-softdev-anonymous-id'
const SESSION_KEY = 'landing-softdev-session-token'

function createId() {
  return crypto.randomUUID()
}

export function getAnonymousId() {
  const stored = localStorage.getItem(ANONYMOUS_KEY)

  if (stored) {
    return stored
  }

  const created = createId()
  localStorage.setItem(ANONYMOUS_KEY, created)
  return created
}

export function getSessionToken() {
  const stored = sessionStorage.getItem(SESSION_KEY)

  if (stored) {
    return stored
  }

  const created = createId()
  sessionStorage.setItem(SESSION_KEY, created)
  return created
}
