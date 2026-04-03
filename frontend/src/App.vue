<script setup>
import { computed, onMounted, ref } from 'vue'

const currentYear = new Date().getFullYear()
const appName = import.meta.env.VITE_APP_NAME || 'Landing Softdev'
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '')
const apiDocsUrl = import.meta.env.VITE_API_DOCS_URL || 'http://localhost:3000/docs'
const rawHealthPath = import.meta.env.VITE_API_HEALTH_PATH || '/health'
const healthPath = rawHealthPath.startsWith('/') ? rawHealthPath : `/${rawHealthPath}`
const healthUrl = computed(() => `${apiBaseUrl}${healthPath}`)

const features = [
  {
    index: '01',
    title: 'Arquitectura separada',
    body: 'Frontend y backend viven en carpetas independientes para que podamos evolucionar UI, APIs y despliegues sin mezclar responsabilidades.',
  },
  {
    index: '02',
    title: 'Swagger listo',
    body: 'NestJS ya expone documentacion base y endpoints iniciales para que cuando llegue el script de BD podamos iterar con contratos claros.',
  },
  {
    index: '03',
    title: 'Variables de entorno definidas',
    body: 'Cada proyecto incluye su .env para puertos, URLs y placeholders de base de datos desde el primer paso.',
  },
]

const milestones = [
  {
    title: 'Frontend',
    body: 'Vue queda listo para una landing moderna, con consumo del backend y una base visual reutilizable.',
  },
  {
    title: 'Backend',
    body: 'NestJS arranca con prefijo global, CORS, health check y configuracion centralizada para conectar la BD mas adelante.',
  },
  {
    title: 'Siguiente iteracion',
    body: 'Cuando compartas el script SQL, armamos modulos, DTOs, servicios y controladores documentados en Swagger.',
  },
]

const status = ref('checking')
const statusMessage = ref('Consultando la disponibilidad del backend base.')
const healthPayload = ref(null)

const statusLabel = computed(() => {
  if (status.value === 'online') {
    return 'Backend listo'
  }

  if (status.value === 'offline') {
    return 'Backend pendiente'
  }

  return 'Verificando backend'
})

const statusClass = computed(() => `status-pill--${status.value}`)

onMounted(async () => {
  try {
    const response = await fetch(healthUrl.value)

    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`)
    }

    const payload = await response.json()
    healthPayload.value = payload
    status.value = 'online'
    statusMessage.value = `Estado ${payload.status} en ${payload.environment}. La base esta lista para que conectemos la BD y empecemos a exponer APIs.`
  } catch (error) {
    status.value = 'offline'
    statusMessage.value =
      'El frontend ya conoce la URL del backend. Cuando levantes NestJS veremos aqui el health check en vivo.'
  }
})
</script>

<template>
  <div class="page-shell">
    <header class="hero">
      <nav class="nav">
        <div class="brand">
          <span class="brand__mark">LS</span>
          <span class="brand__name">{{ appName }}</span>
        </div>

        <a class="ghost-link" :href="apiDocsUrl" target="_blank" rel="noreferrer">
          Abrir Swagger
        </a>
      </nav>

      <div class="hero__content">
        <div class="hero__copy">
          <p class="eyebrow">Landing + API desacopladas</p>
          <h1>Vue para la experiencia y NestJS para la logica, cada uno en su propio espacio.</h1>
          <p class="lead">
            Ya tienes una base limpia para construir una landing conectada a una API real,
            con configuracion lista para enlazar la base de datos en la siguiente iteracion.
          </p>

          <div class="hero__actions">
            <a class="button button--primary" :href="apiDocsUrl" target="_blank" rel="noreferrer">
              Ver documentacion
            </a>
            <a class="button button--secondary" :href="healthUrl" target="_blank" rel="noreferrer">
              Probar health check
            </a>
          </div>

          <section class="status-card">
            <div class="status-card__header">
              <span class="status-pill" :class="statusClass">{{ statusLabel }}</span>
              <code>{{ healthUrl }}</code>
            </div>

            <p>{{ statusMessage }}</p>

            <dl v-if="healthPayload" class="status-grid">
              <div>
                <dt>Entorno</dt>
                <dd>{{ healthPayload.environment }}</dd>
              </div>
              <div>
                <dt>Prefijo</dt>
                <dd>/{{ healthPayload.apiPrefix }}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{{ healthPayload.status }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside class="hero__panel">
          <article class="stack-card">
            <p class="stack-card__label">Stack base</p>
            <h2>Separacion clara desde el inicio</h2>
            <ul class="stack-list">
              <li><span>Frontend</span><strong>Vue 3 + Vite</strong></li>
              <li><span>Backend</span><strong>NestJS + Swagger</strong></li>
              <li><span>Env</span><strong>.env por proyecto</strong></li>
            </ul>
          </article>

          <article class="stack-card stack-card--accent">
            <p class="stack-card__label">Proxima etapa</p>
            <h2>Pasame el script de BD y armamos las APIs.</h2>
            <p>
              Con esta base ya podemos agregar modulos, modelos, servicios y endpoints sin
              rehacer la estructura del proyecto.
            </p>
          </article>
        </aside>
      </div>
    </header>

    <main>
      <section class="section">
        <div class="section__header">
          <p class="section__eyebrow">Lo que ya queda resuelto</p>
          <h2>Una base pensada para crecer sin mezclar capas.</h2>
        </div>

        <div class="feature-grid">
          <article v-for="feature in features" :key="feature.index" class="feature-card">
            <p class="feature-card__index">{{ feature.index }}</p>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.body }}</p>
          </article>
        </div>
      </section>

      <section class="section section--alt">
        <div class="section__header">
          <p class="section__eyebrow">Roadmap inmediato</p>
          <h2>El flujo ya esta preparado para la siguiente iteracion.</h2>
        </div>

        <div class="timeline">
          <article v-for="item in milestones" :key="item.title" class="timeline__item">
            <span class="timeline__dot"></span>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.body }}</p>
            </div>
          </article>
        </div>
      </section>
    </main>

    <footer class="footer">
      <p>{{ appName }} - Base inicial para landing y APIs futuras.</p>
      <p>{{ currentYear }}</p>
    </footer>
  </div>
</template>
