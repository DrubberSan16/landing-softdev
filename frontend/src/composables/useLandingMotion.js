import { animate, hover, inView, stagger } from 'framer-motion/dom'

const easeOut = [0.22, 1, 0.36, 1]

export function initLandingMotion(rootElement) {
  if (!rootElement) return () => {}

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    rootElement.dataset.motion = 'reduced'
    return () => {}
  }

  rootElement.dataset.motion = 'ready'
  const cleanups = []
  const controls = []
  const heroItems = rootElement.querySelectorAll('.js-hero-reveal')

  if (heroItems.length) {
    controls.push(
      animate(
        heroItems,
        { opacity: [0, 1], y: [22, 0] },
        { duration: 0.65, delay: stagger(0.09), ease: easeOut },
      ),
    )
  }

  rootElement.querySelectorAll('.js-reveal').forEach((element) => {
    animate(element, { opacity: 0, y: 26 }, { duration: 0 })
    cleanups.push(
      inView(
        element,
        () => controls.push(animate(element, { opacity: 1, y: 0 }, { duration: 0.58, ease: easeOut })),
        { margin: '0px 0px -12% 0px', amount: 0.18 },
      ),
    )
  })

  rootElement.querySelectorAll('.js-hover-card').forEach((element) => {
    cleanups.push(
      hover(element, () => {
        controls.push(animate(element, { y: -6, scale: 1.012 }, { duration: 0.24, ease: easeOut }))
        return () => controls.push(animate(element, { y: 0, scale: 1 }, { duration: 0.22, ease: easeOut }))
      }),
    )
  })

  return () => {
    cleanups.forEach((cleanup) => cleanup?.())
    controls.forEach((control) => control?.stop?.())
  }
}
