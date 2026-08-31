<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { animate } from 'framer-motion/dom'
import { Blocks, Compass, PenTool, Rocket } from 'lucide-vue-next'

const stages = [
  {
    id: 'descubrir',
    label: 'Descubrir',
    title: 'El proceso primero',
    body: 'Identificamos decisiones, responsables y puntos de fricción antes de diseñar la solución.',
    metric: 'Mapa operativo',
    x: 50,
    y: 9,
    icon: Compass,
  },
  {
    id: 'disenar',
    label: 'Diseñar',
    title: 'Una experiencia clara',
    body: 'Prototipamos la ruta más simple para que cada rol encuentre exactamente lo que necesita.',
    metric: 'Flujos validados',
    x: 88,
    y: 49,
    icon: PenTool,
  },
  {
    id: 'construir',
    label: 'Construir',
    title: 'Tecnología conectada',
    body: 'Integramos datos, automatizaciones y controles sobre una arquitectura lista para evolucionar.',
    metric: 'Entrega incremental',
    x: 50,
    y: 88,
    icon: Blocks,
  },
  {
    id: 'evolucionar',
    label: 'Evolucionar',
    title: 'Mejora con evidencia',
    body: 'Medimos el uso real y convertimos nuevos hallazgos en versiones cada vez más útiles.',
    metric: 'Crecimiento continuo',
    x: 12,
    y: 49,
    icon: Rocket,
  },
]

const activeIndex = ref(0)
const orbitRoot = ref(null)
let stopAnimation = () => {}

watch(activeIndex, async () => {
  await nextTick()

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  stopAnimation()
  const activeNode = orbitRoot.value?.querySelector('.orbit-node.is-active')

  if (activeNode) {
    const playback = animate(activeNode, { scale: [0.96, 1.08, 1] }, { duration: 0.42 })
    stopAnimation = () => playback.stop()
  }
})

onBeforeUnmount(() => stopAnimation())
</script>

<template>
  <figure ref="orbitRoot" class="experience-card orbit-experience js-reveal" aria-labelledby="orbit-title">
    <figcaption class="experience-card__header">
      <span class="experience-card__index">01</span>
      <div>
        <p class="section-kicker">Ruta interactiva</p>
        <h3 id="orbit-title">Tu idea, conectada de principio a fin.</h3>
      </div>
    </figcaption>

    <div class="orbit-stage" aria-label="Selecciona una etapa del proceso">
      <div class="orbit-stage__halo orbit-stage__halo--outer" aria-hidden="true"></div>
      <div class="orbit-stage__halo orbit-stage__halo--inner" aria-hidden="true"></div>
      <svg class="orbit-stage__connections" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 9 L88 49 L50 88 L12 49 Z" />
        <path class="orbit-stage__pulse" d="M50 9 L88 49 L50 88 L12 49 Z" />
      </svg>

      <div class="orbit-core" aria-hidden="true">
        <span>SED</span>
        <small>Tu sistema</small>
      </div>

      <button
        v-for="(stage, index) in stages"
        :key="stage.id"
        class="orbit-node"
        :class="{ 'is-active': activeIndex === index }"
        :style="{ '--node-x': `${stage.x}%`, '--node-y': `${stage.y}%` }"
        type="button"
        :aria-pressed="activeIndex === index"
        :aria-label="`Ver etapa ${stage.label}`"
        @click="activeIndex = index"
        @mouseenter="activeIndex = index"
        @focus="activeIndex = index"
      >
        <component :is="stage.icon" :size="19" :stroke-width="1.8" aria-hidden="true" />
        <span>{{ stage.label }}</span>
      </button>
    </div>

    <div class="orbit-detail" aria-live="polite">
      <div>
        <span>{{ stages[activeIndex].metric }}</span>
        <h4>{{ stages[activeIndex].title }}</h4>
      </div>
      <p>{{ stages[activeIndex].body }}</p>
    </div>
  </figure>
</template>
