export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'Software Easy Dev S.A.S.',
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, ''),
  apiDocsUrl: import.meta.env.VITE_API_DOCS_URL || 'http://localhost:3000/docs',
  defaultAdminEmail: import.meta.env.VITE_ADMIN_DEFAULT_EMAIL || 'admin@tuempresa.com',
}
