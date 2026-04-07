import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { trackPageVisit } from '../services/tracking'

export function usePublicTracking(extra = {}) {
  const route = useRoute()

  watch(
    () => route.fullPath,
    () => {
      const resolvedExtra = typeof extra === 'function' ? extra() : extra

      trackPageVisit({
        path: route.fullPath,
        pageType: route.meta.pageType || 'other',
        routeName: route.meta.routeName || route.name || 'route',
        ...resolvedExtra,
      })
    },
    { immediate: true },
  )
}
