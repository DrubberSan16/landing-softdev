const ERP_SESSION_KEY = 'software-easy-dev-erp-session'

export function getErpSessionToken() {
  return localStorage.getItem(ERP_SESSION_KEY) || ''
}

export function setErpSessionToken(token) {
  localStorage.setItem(ERP_SESSION_KEY, token)
}

export function clearErpSessionToken() {
  localStorage.removeItem(ERP_SESSION_KEY)
}
