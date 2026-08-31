<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { animate, stagger } from 'framer-motion/dom'
import { BarChart3, Boxes, UsersRound } from 'lucide-vue-next'

const views = [
  {
    id: 'operacion',
    label: 'Operación',
    icon: Boxes,
    value: '86%',
    caption: 'procesos visibles',
    bars: [42, 62, 55, 78, 68, 92, 84],
    activity: ['Orden aprobada', 'Stock actualizado', 'Alerta resuelta'],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    icon: UsersRound,
    value: '+34%',
    caption: 'seguimiento oportuno',
    bars: [36, 48, 72, 60, 82, 76, 96],
    activity: ['Lead calificado', 'Demo agendada', 'Propuesta enviada'],
  },
  {
    id: 'datos',
    label: 'Datos',
    icon: BarChart3,
    value: '1 vista',
    caption: 'para decidir mejor',
    bars: [28, 52, 46, 69, 74, 88, 94],
    activity: ['Indicador actualizado', 'Desvío detectado', 'Reporte compartido'],
  },
]

const activeIndex = ref(0)
const visualRoot = ref(null)
let stopAnimation = () => {}

function updateSpotlight(event) {
  const bounds = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - bounds.left) / bounds.width) * 100
  const y = ((event.clientY - bounds.top) / bounds.height) * 100
  const rotateX = ((y - 50) / 50) * -2.5
  const rotateY = ((x - 50) / 50) * 3

  event.currentTarget.style.setProperty('--spot-x', `${x}%`)
  event.currentTarget.style.setProperty('--spot-y', `${y}%`)
  event.currentTarget.style.setProperty('--tilt-x', `${rotateX}deg`)
  event.currentTarget.style.setProperty('--tilt-y', `${rotateY}deg`)
}

function resetSpotlight(event) {
  event.currentTarget.style.setProperty('--spot-x', '50%')
  event.currentTarget.style.setProperty('--spot-y', '42%')
  event.currentTarget.style.setProperty('--tilt-x', '0deg')
  event.currentTarget.style.setProperty('--tilt-y', '0deg')
}

async function animateChart() {
  await nextTick()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  stopAnimation()
  const bars = visualRoot.value?.querySelectorAll('.product-chart__bar') || []
  const playback = animate(
    bars,
    { scaleY: [0.2, 1], opacity: [0.35, 1] },
    { duration: 0.5, delay: stagger(0.045), ease: [0.22, 1, 0.36, 1] },
  )
  stopAnimation = () => playback.stop()
}

watch(activeIndex, animateChart)
onMounted(animateChart)
onBeforeUnmount(() => stopAnimation())
</script>

<template>
  <figure class="experience-card product-experience js-reveal" aria-labelledby="product-scene-title">
    <figcaption class="experience-card__header">
      <span class="experience-card__index">02</span>
      <div>
        <p class="section-kicker">Vista viva</p>
        <h3 id="product-scene-title">Información que responde a tu foco.</h3>
      </div>
    </figcaption>

    <div class="product-switcher" role="group" aria-label="Cambiar vista del sistema">
      <button
        v-for="(view, index) in views"
        :key="view.id"
        type="button"
        :class="{ 'is-active': activeIndex === index }"
        :aria-pressed="activeIndex === index"
        @click="activeIndex = index"
      >
        <component :is="view.icon" :size="16" :stroke-width="1.8" aria-hidden="true" />
        {{ view.label }}
      </button>
    </div>

    <div
      ref="visualRoot"
      class="product-visual"
      tabindex="0"
      aria-label="Vista previa interactiva de un dashboard empresarial"
      @pointermove="updateSpotlight"
      @pointerleave="resetSpotlight"
      @blur="resetSpotlight"
    >
      <div class="product-visual__spotlight" aria-hidden="true"></div>
      <div class="product-window">
        <div class="product-window__bar" aria-hidden="true"><i></i><i></i><i></i><span>softwareeasy.dev / panel</span></div>
        <div class="product-window__body">
          <aside aria-hidden="true">
            <span class="is-brand">SE</span><i></i><i></i><i></i><i></i>
          </aside>
          <div class="product-window__content">
            <div class="product-summary">
              <div><small>{{ views[activeIndex].label }}</small><strong>{{ views[activeIndex].value }}</strong><span>{{ views[activeIndex].caption }}</span></div>
              <span class="product-summary__status"><i></i> En tiempo real</span>
            </div>
            <div class="product-chart" aria-hidden="true">
              <span
                v-for="(height, index) in views[activeIndex].bars"
                :key="`${views[activeIndex].id}-${index}`"
                class="product-chart__bar"
                :style="{ '--bar-height': `${height}%` }"
              ></span>
            </div>
            <div class="product-activity">
              <div v-for="(item, index) in views[activeIndex].activity" :key="item">
                <span>{{ String(index + 1).padStart(2, '0') }}</span>
                <p>{{ item }}</p>
                <i></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p class="experience-card__hint">Mueve el cursor sobre la interfaz o cambia la vista.</p>
  </figure>
</template>
