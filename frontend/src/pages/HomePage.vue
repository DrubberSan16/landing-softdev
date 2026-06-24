<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import LeadFormCard from '../components/LeadFormCard.vue'
import StatCard from '../components/StatCard.vue'
import { usePublicTracking } from '../composables/usePublicTracking'
import { publicApi } from '../services/api'
import { appConfig } from '../services/config'

usePublicTracking()

const loading = ref(true)
const categories = ref([])
const technologies = ref([])
const landingProjects = ref([])
const errorMessage = ref('')

const heroStats = [
  { label: 'Procesos a medida', value: '100%', caption: 'software pensado para tu forma de trabajar' },
  { label: 'Operacion clara', value: '24/7', caption: 'datos, tareas y seguimiento en un solo lugar' },
  { label: 'Entrega guiada', value: '1:1', caption: 'acompanamiento cercano desde la idea' },
]

const transformationCards = [
  {
    title: 'Menos tareas repetidas',
    body: 'Automatizamos capturas, aprobaciones, reportes, notificaciones y flujos internos para que tu equipo gane tiempo todos los dias.',
  },
  {
    title: 'Software que se adapta',
    body: 'No forzamos tu negocio a usar una plantilla. Disenamos pantallas, roles y procesos segun tus reglas reales.',
  },
  {
    title: 'Decisiones con datos',
    body: 'Centralizamos informacion dispersa para que puedas medir ventas, operacion, clientes, inventario o cualquier proceso clave.',
  },
]

const processSteps = [
  {
    step: '01',
    title: 'Entendemos tu dia a dia',
    body: 'Mapeamos como trabaja tu equipo, que tareas duelen y que informacion necesitas tener bajo control.',
  },
  {
    step: '02',
    title: 'Disenamos la experiencia',
    body: 'Creamos una solucion clara, facil de usar y alineada a tus objetivos comerciales y operativos.',
  },
  {
    step: '03',
    title: 'Construimos e integramos',
    body: 'Desarrollamos tu plataforma, conectamos herramientas necesarias y dejamos una base lista para crecer.',
  },
  {
    step: '04',
    title: 'Acompanamos la mejora',
    body: 'Medimos el uso, ajustamos flujos y evolucionamos el software contigo cuando tu negocio cambia.',
  },
]

const solutionTypes = [
  'CRM y seguimiento comercial',
  'Gestion de inventario y pedidos',
  'Portales para clientes y proveedores',
  'Automatizacion administrativa',
  'Dashboards e indicadores',
  'Aplicaciones web a medida',
]

const trustSignals = [
  'Soluciones entendibles para equipos no tecnicos.',
  'Arquitectura preparada para cambios futuros.',
  'Comunicacion clara durante todo el desarrollo.',
  'Paneles privados para controlar usuarios, datos y procesos.',
]

function isMainLandingProject(project) {
  const slug = (project?.slug || '').toLowerCase()
  const title = (project?.title || '').toLowerCase()

  return slug === 'k' || slug.includes('kintiporta') || title.includes('kintiporta')
}

const contactHighlights = [
  {
    value: '48h',
    title: 'Diagnostico inicial',
    body: 'Revisamos tu flujo actual y ubicamos oportunidades claras para ahorrar tiempo.',
  },
  {
    value: '3 pasos',
    title: 'Ruta de implementacion',
    body: 'Priorizamos alcance, etapas y entregables para que sepas como avanzar desde el inicio.',
  },
]

const stats = computed(() => {
  const dynamicStats = []

  if (categories.value.length) {
    dynamicStats.push({
      label: 'Areas de negocio',
      value: categories.value.length,
      caption: 'tipos de procesos que podemos digitalizar',
    })
  }

  if (technologies.value.length) {
    dynamicStats.push({
      label: 'Herramientas modernas',
      value: technologies.value.length,
      caption: 'tecnologias disponibles para crear tu solucion',
    })
  }

  return [...heroStats, ...dynamicStats].slice(0, 3)
})

onMounted(async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const payload = await publicApi.getHomeData()
    categories.value = payload.categories || []
    technologies.value = payload.technologies || []
    landingProjects.value = payload.featuredProjects || []
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="page-stack page-stack--landing">
    <section class="hero hero--landing" id="inicio">
      <div class="hero__content">
        <div class="hero__copy">
          <p class="eyebrow">Software Easy Dev S.A.S.</p>
          <h1>Digitaliza tus procesos a tu gusto, con software creado para tu negocio.</h1>
          <p class="lead">
            Convertimos tareas manuales, hojas sueltas y procesos desordenados en plataformas
            simples, modernas y hechas a medida. Tu empresa trabaja como quiere; el software se
            adapta a esa forma de operar.
          </p>

          <div class="hero__actions">
            <RouterLink class="button button--primary" :to="{ path: '/', hash: '#contacto' }">
              Quiero digitalizar mi proceso
            </RouterLink>
            <RouterLink class="button button--secondary" :to="{ path: '/', hash: '#proceso' }">
              Ver como trabajamos
            </RouterLink>
          </div>

          <div class="hero__stats">
            <StatCard
              v-for="stat in stats"
              :key="stat.label"
              :label="stat.label"
              :value="stat.value"
              :caption="stat.caption"
            />
          </div>
        </div>

        <aside class="hero__visual" aria-label="Flujo de digitalizacion">
          <div class="workflow-board">
            <div class="workflow-board__brand">
              <img src="/img/software-easy-dev-logo.svg" :alt="appConfig.appName" />
              <span>Tu operacion digital</span>
            </div>

            <div class="workflow-board__lane">
              <span>Solicitud</span>
              <strong>Cliente envia datos</strong>
            </div>
            <div class="workflow-board__lane workflow-board__lane--accent">
              <span>Automatizacion</span>
              <strong>El sistema ordena tareas</strong>
            </div>
            <div class="workflow-board__lane">
              <span>Resultado</span>
              <strong>Equipo decide con claridad</strong>
            </div>

            <div class="workflow-board__meter">
              <span>Tiempo recuperado</span>
              <strong>+68%</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section v-if="landingProjects.length" class="section landing-projects" id="proyectos-destacados">
      <div class="section__header section__header--inline">
        <div>
          <p class="section__eyebrow">Páginas disponibles</p>
          <h2>Conoce las soluciones que hemos publicado.</h2>
        </div>
        <RouterLink class="text-link" to="/proyectos">Ver todos los proyectos</RouterLink>
      </div>

      <div class="landing-projects__grid">
        <article v-for="project in landingProjects" :key="project.publicId" class="landing-project-card">
          <p class="section__eyebrow">{{ project.categoryName || 'Proyecto' }}</p>
          <span v-if="isMainLandingProject(project)" class="project-card__primary-badge">
            Producto principal
          </span>
          <h3>{{ project.title }}</h3>
          <p v-if="isMainLandingProject(project)" class="landing-project-card__highlight">
            Demo desarrollado por Software Easy Dev para presentar una plataforma real a clientes.
          </p>
          <p>{{ project.shortDescription }}</p>
          <a :href="project.demoUrl" target="_blank" rel="noopener noreferrer">
            {{ project.demoUrl }}
          </a>
        </article>
      </div>
    </section>

    <section class="section" id="conocenos">
      <div class="section__header section__header--center">
        <p class="section__eyebrow">Tu negocio, pero mas simple</p>
        <h2>Disenamos software para que trabajar sea mas ordenado, rapido y medible.</h2>
        <p class="section__intro">
          Cada empresa tiene una manera distinta de vender, atender, producir, registrar y tomar
          decisiones. Nosotros convertimos esa forma de operar en herramientas digitales que tu
          equipo entiende desde el primer uso.
        </p>
      </div>

      <div class="feature-grid feature-grid--triple">
        <article v-for="item in transformationCards" :key="item.title" class="feature-card feature-card--bright">
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
        </article>
      </div>
    </section>

    <section class="section section--band" id="proceso">
      <div class="section__header">
        <p class="section__eyebrow">Proceso claro</p>
        <h2>Pasamos de la idea al software sin complicarte el camino.</h2>
      </div>

      <div class="process-grid">
        <article v-for="item in processSteps" :key="item.step" class="process-card">
          <span>{{ item.step }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
        </article>
      </div>
    </section>

    <section class="section" id="servicios">
      <div class="split-grid split-grid--balanced">
        <article class="info-card info-card--light">
          <p class="section__eyebrow">Soluciones a medida</p>
          <h2>Digitalizamos el proceso que mas impacto tenga en tu empresa.</h2>
          <p>
            Podemos construir desde una herramienta puntual hasta una plataforma completa. Lo
            importante es que el sistema responda a tus necesidades reales, no al reves.
          </p>

          <div class="solution-cloud">
            <span v-for="solution in solutionTypes" :key="solution">{{ solution }}</span>
          </div>
        </article>

        <article class="info-card info-card--contrast">
          <p class="section__eyebrow">Por que elegirnos</p>
          <h2>Te hablamos claro, construimos con criterio y cuidamos la experiencia.</h2>
          <ul class="bullet-list">
            <li v-for="item in trustSignals" :key="item">{{ item }}</li>
          </ul>
          <RouterLink class="button button--primary" :to="{ path: '/', hash: '#contacto' }">
            Hablemos de tu proceso
          </RouterLink>
        </article>
      </div>
    </section>

    <section class="section section--alt" id="tecnologias">
      <div class="section__header section__header--inline">
        <div>
          <p class="section__eyebrow">Capacidades flexibles</p>
          <h2>Combinamos negocio, diseno y tecnologia para crear herramientas utiles.</h2>
        </div>
        <RouterLink class="text-link" :to="{ path: '/', hash: '#contacto' }">Solicitar propuesta</RouterLink>
      </div>

      <div v-if="loading" class="empty-state">
        <p>Cargando capacidades...</p>
      </div>

      <div v-else-if="errorMessage" class="empty-state">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else class="capability-grid">
        <article class="info-card">
          <h3>Procesos que podemos ordenar</h3>
          <div class="pill-cloud">
            <span v-for="category in categories" :key="category.publicId">{{ category.name }}</span>
            <span v-if="!categories.length">Ventas</span>
            <span v-if="!categories.length">Operacion</span>
            <span v-if="!categories.length">Administracion</span>
          </div>
        </article>

        <article class="info-card">
          <h3>Tecnologias para construir con solidez</h3>
          <div class="pill-cloud pill-cloud--soft">
            <span v-for="technology in technologies" :key="technology.publicId">
              {{ technology.name }}
            </span>
            <span v-if="!technologies.length">Aplicaciones web</span>
            <span v-if="!technologies.length">Automatizaciones</span>
            <span v-if="!technologies.length">Dashboards</span>
          </div>
        </article>
      </div>
    </section>

    <section class="section section--contact" id="contacto">
      <div class="split-grid">
        <article class="contact-copy">
          <p class="section__eyebrow">Empecemos por tu necesidad</p>
          <h2>Cuentanos que proceso quieres mejorar y te proponemos una ruta digital.</h2>
          <p>
            No necesitas llegar con una idea tecnica. Basta con contarnos que haces hoy, que te
            quita tiempo y que resultado esperas. Nosotros te ayudamos a convertirlo en software.
          </p>
          <ul class="bullet-list">
            <li>Analisis inicial de tu flujo actual.</li>
            <li>Propuesta de alcance, etapas y prioridades.</li>
            <li>Seguimiento comercial desde un panel privado.</li>
          </ul>

          <div class="contact-highlight-grid" aria-label="Beneficios del primer contacto">
            <article
              v-for="item in contactHighlights"
              :key="item.title"
              class="contact-highlight-card"
            >
              <strong>{{ item.value }}</strong>
              <h3>{{ item.title }}</h3>
              <p>{{ item.body }}</p>
            </article>
          </div>
        </article>

        <LeadFormCard compact />
      </div>
    </section>
  </main>
</template>
