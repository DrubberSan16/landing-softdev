import { publicApi } from './api'
import { getAnonymousId, getSessionToken } from '../utils/visitor-session'

export async function trackPageVisit({ path, pageType, routeName, projectSlug, projectPublicId }) {
  try {
    await publicApi.trackPageView({
      anonymousId: getAnonymousId(),
      sessionToken: getSessionToken(),
      path,
      pageType,
      routeName,
      projectSlug,
      projectPublicId,
      deviceType: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browserName: navigator.userAgent,
      osName: navigator.platform,
      referrerUrl: document.referrer || undefined,
    })
  } catch (error) {
    console.warn('No se pudo registrar la visita.', error)
  }
}
