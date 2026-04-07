<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import LeadFormCard from '../components/LeadFormCard.vue'
import ProjectCard from '../components/ProjectCard.vue'
import StatCard from '../components/StatCard.vue'
import { usePublicTracking } from '../composables/usePublicTracking'
import { publicApi } from '../services/api'
import { appConfig } from '../services/config'

usePublicTracking()

const loading = ref(true)
const featuredProjects = ref([])
const categories = ref([])
const technologies = ref([])
const errorMessage = ref('')

const aboutCards = [
  {
    title: 'Conocemos negocio y producto',
    body: 'Traducimos necesidades comerciales en plataformas, automatizaciones y experiencias digitales listas para escalar.',
  },
  {
    title: 'Construimos con stack moderno',
    body: 'Disenamos soluciones con arquitectura clara, componentes reutilizables y foco en mantenibilidad operativa.',
  },
  {
    title: 'Medimos para vender mejor',
    body: 'Cada demo, clic o lead deja trazabilidad para mejorar conversion, narrativa comercial y toma de decisiones.',
  },
]

const strategicPillars = [
  {
    kicker: 'Mision',
    title: 'Convertir ideas de negocio en plataformas utiles, claras y listas para crecer.',
    body: 'Desarrollamos soluciones digitales que unen experiencia de usuario, arquitectura moderna y foco comercial para que cada proyecto genere valor real.',
    image: '/img/landing-mission-illustration.svg',
    alt: 'Ilustracion de mision corporativa con equipo, interfaz y flujo de trabajo digital.',
    points: [
      'Acompanamos desde la idea inicial hasta la puesta en marcha.',
      'Construimos experiencias amigables para usuarios finales y equipos internos.',
      'Priorizamos calidad tecnica, mantenibilidad y resultados medibles.',
    ],
  },
  {
    kicker: 'Vision',
    title: 'Ser una fabrica de software reconocida por crear experiencias confiables y escalables.',
    body: 'Buscamos posicionarnos como un aliado estrategico para empresas que necesitan evolucion digital, visibilidad comercial y operacion centralizada.',
    image: '/img/landing-vision-illustration.svg',
    alt: 'Ilustracion de vision corporativa con pantallas, mapa de conexiones y crecimiento.',
    points: [
      'Impulsar productos con identidad visual y narrativa clara.',
      'Integrar analitica, automatizacion y gestion operativa en una sola plataforma.',
      'Escalar soluciones sin perder cercania con el cliente ni foco en conversion.',
    ],
  },
  {
    kicker: 'Objetivo',
    title: 'Transformar la landing en una herramienta activa de captacion, confianza y seguimiento.',
    body: 'Nuestro objetivo es que cada visita se convierta en una oportunidad medible, conectando demos, contenido institucional y contacto comercial en un solo recorrido.',
    image: '/img/landing-objective-illustration.svg',
    alt: 'Ilustracion de objetivo comercial con embudo de conversion, leads y seguimiento.',
    points: [
      'Presentar servicios, capacidades y demos con una experiencia intuitiva.',
      'Captar leads con contexto y trazabilidad para el equipo comercial.',
      'Facilitar decisiones con metricas, panel interno y control editorial.',
    ],
  },
]

const services = [
  {
    title: 'Landing corporativa orientada a conversion',
    body: 'Presentamos la empresa, sus servicios y sus diferenciales con una estructura comercial clara y medible.',
  },
  {
    title: 'Catalogo navegable de proyectos demo',
    body: 'Mostramos soluciones funcionales con contexto de negocio, stack, medios, documentacion y acceso controlado a demos.',
  },
  {
    title: 'Panel administrativo privado',
    body: 'Centralizamos leads, proyectos, categorias, tecnologias, metricas, notificaciones y control editorial.',
  },
]

const differentiators = [
  'Un mismo nucleo logico para marketing, administracion y analitica.',
  'Portafolio demo que funciona como activo comercial real.',
  'Captura de leads y seguimiento interno sin perder contexto del visitante.',
]

const adminBenefits = [
  'Dashboard con visitantes, clicks a demos y conversion por proyecto.',
  'Gestion de proyectos, categorias, tecnologias, contactos y usuarios.',
  'Acceso privado para iniciar sesion administrativa cuando el equipo lo requiera.',
]

const stats = computed(() => [
  { label: 'Demos destacados', value: featuredProjects.value.length, caption: 'activos para exhibicion comercial' },
  { label: 'Categorias activas', value: categories.value.length, caption: 'ordenan el portafolio digital' },
  { label: 'Tecnologias visibles', value: technologies.value.length, caption: 'respaldo tecnico de la empresa' },
])

onMounted(async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const payload = await publicApi.getHomeData()
    featuredProjects.value = payload.featuredProjects || []
    categories.value = payload.categories || []
    technologies.value = payload.technologies || []
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
          <h1>Soluciones de software que combinan presencia digital, demos reales y operacion medible.</h1>
          <p class="lead">
            {{ appConfig.appName }} impulsa su propuesta de valor con una landing corporativa
            moderna, un catalogo funcional de proyectos demo y un panel administrativo preparado
            para captar oportunidades y convertir interes en negocio.
          </p>

          <div class="hero__actions">
            <RouterLink class="button button--primary" to="/proyectos">
              Ver proyectos demo
            </RouterLink>
            <RouterLink class="button button--secondary" :to="{ path: '/', hash: '#contacto' }">
              Solicitar reunion
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

        <aside class="hero__panel">
          <article class="stack-card stack-card--accent">
            <img
              class="hero__brand-art"
              src="/img/software-easy-dev-logo.svg"
              alt="Software Easy Dev S.A.S."
            />
            <p class="stack-card__label">Propuesta corporativa</p>
            <h2>Exhibimos capacidad tecnica con una experiencia comercial clara y profesional.</h2>
            <p>
              La landing trabaja como vitrina digital de la empresa, mientras el backend concentra
              formularios, demos, metricas y seguimiento operativo bajo una sola plataforma.
            </p>
          </article>

          <article class="stack-card">
            <p class="stack-card__label">Diferenciadores</p>
            <ul class="bullet-list">
              <li v-for="item in differentiators" :key="item">{{ item }}</li>
            </ul>
          </article>
        </aside>
      </div>
    </section>

    <section class="section" id="conocenos">
      <div class="section__header">
        <p class="section__eyebrow">Conocenos</p>
        <h2>Somos una fabrica de software enfocada en resultados, experiencia y escalabilidad.</h2>
      </div>

      <div class="feature-grid feature-grid--triple">
        <article v-for="item in aboutCards" :key="item.title" class="feature-card feature-card--soft">
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
        </article>
      </div>

      <div class="section__subgroup">
        <div class="section__header">
          <p class="section__eyebrow">Esencia institucional</p>
          <h2>Mision, vision y objetivo alineados a una experiencia cercana, medible y confiable.</h2>
          <p class="section__intro">
            Presentamos una identidad clara para que cada visitante entienda que hacemos,
            como trabajamos y hacia donde llevamos cada solucion digital.
          </p>
        </div>

        <div class="media-gallery">
          <article v-for="pillar in strategicPillars" :key="pillar.kicker" class="media-card media-card--showcase">
            <img :src="pillar.image" :alt="pillar.alt" />

            <div class="media-card__body media-card__body--spacious">
              <p class="stack-card__label">{{ pillar.kicker }}</p>
              <h3>{{ pillar.title }}</h3>
              <p>{{ pillar.body }}</p>
              <ul class="bullet-list">
                <li v-for="point in pillar.points" :key="point">{{ point }}</li>
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="servicios">
      <div class="section__header">
        <p class="section__eyebrow">Servicios y propuesta</p>
        <h2>La plataforma no solo presenta servicios: apoya conversion, seguimiento y operacion.</h2>
      </div>

      <div class="feature-grid">
        <article v-for="service in services" :key="service.title" class="feature-card">
          <h3>{{ service.title }}</h3>
          <p>{{ service.body }}</p>
        </article>
      </div>
    </section>

    <section class="section section--alt" id="proyectos">
      <div class="section__header section__header--inline">
        <div>
        <p class="section__eyebrow">Catalogo funcional</p>
        <h2>Demos destacados para mostrar capacidad tecnica con contexto de negocio.</h2>
        </div>
        <RouterLink class="text-link" to="/proyectos">Ver catalogo completo</RouterLink>
      </div>

      <div v-if="loading" class="empty-state">
        <p>Cargando demos publicados...</p>
      </div>

      <div v-else-if="errorMessage" class="empty-state">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else class="project-grid">
        <ProjectCard v-for="project in featuredProjects" :key="project.publicId" :project="project" />
      </div>
    </section>

    <section class="section" id="tecnologias">
      <div class="split-grid">
        <article class="info-card">
          <p class="section__eyebrow">Capacidades visibles</p>
          <h2>Categorias, stack y tipos de soluciones que respaldan la propuesta de Software Easy Dev S.A.S.</h2>
          <p>
            Organizamos la oferta por categorias y tecnologias para que cada visitante entienda con
            rapidez que tipo de soluciones construimos y con que herramientas las ejecutamos.
          </p>
          <div class="pill-cloud">
            <span v-for="category in categories" :key="category.publicId">{{ category.name }}</span>
          </div>
          <div class="pill-cloud pill-cloud--soft">
            <span v-for="technology in technologies" :key="technology.publicId">
              {{ technology.name }}
            </span>
          </div>
        </article>

        <article class="info-card info-card--contrast">
          <p class="section__eyebrow">Acceso administrativo</p>
          <h2>La misma plataforma incluye control interno para el equipo.</h2>
          <ul class="bullet-list">
            <li v-for="item in adminBenefits" :key="item">{{ item }}</li>
          </ul>
          <RouterLink class="button button--secondary" :to="{ path: '/', hash: '#login-admin' }">
            Ir a login administrativo
          </RouterLink>
        </article>
      </div>
    </section>

    <section class="section" id="contacto">
      <div class="split-grid">
        <article class="info-card">
          <p class="section__eyebrow">Contacto comercial</p>
          <h2>Convirtamos una idea, un demo o una necesidad operativa en una solucion real.</h2>
          <p>
            Si necesitas una landing, una automatizacion, una plataforma empresarial o una demo
            personalizada, comparte tu requerimiento y el equipo podra gestionarlo desde el panel
            interno con trazabilidad completa.
          </p>
          <ul class="bullet-list">
            <li>Solicitudes asociadas a proyectos demo cuando aplique.</li>
            <li>Seguimiento centralizado para equipo comercial y operativo.</li>
            <li>Captura estructurada de contexto, datos y canal preferido.</li>
          </ul>
        </article>

        <LeadFormCard :projects="featuredProjects" compact />
      </div>
    </section>
  </main>
</template>
