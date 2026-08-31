<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import CircuitBoard from '../components/CircuitBoard.vue'
import LeadFormCard from '../components/LeadFormCard.vue'
import { initLandingMotion } from '../composables/useLandingMotion'
import { usePublicTracking } from '../composables/usePublicTracking'
import { publicApi } from '../services/api'

usePublicTracking()

const landingRoot = ref(null)
const loading = ref(true)
const categories = ref([])
const technologies = ref([])
const landingProjects = ref([])
const errorMessage = ref('')
let stopMotion = () => {}

const impactCards = [
  { number: '01', title: 'Procesos que sí reflejan tu negocio', body: 'Diseñamos roles, pantallas y reglas alrededor de tu operación real, sin obligarte a trabajar como una plantilla.', icon: 'flow', className: 'impact-card--wide' },
  { number: '02', title: 'Datos listos para decidir', body: 'Unificamos ventas, operación e indicadores para que cada decisión parta de información confiable.', icon: 'chart', className: 'impact-card--tall' },
  { number: '03', title: 'Automatización útil', body: 'Menos captura manual, más validaciones, alertas y flujos que avanzan solos.', icon: 'bolt', className: '' },
  { number: '04', title: 'Evolución acompañada', body: 'Medimos, ajustamos y escalamos la solución cuando tu empresa cambia.', icon: 'orbit', className: '' },
]

const processSteps = [
  { step: '01', eyebrow: 'Descubrir', title: 'Entendemos cómo trabajas', body: 'Mapeamos tareas, decisiones, responsables y cuellos de botella antes de escribir una línea de código.' },
  { step: '02', eyebrow: 'Diseñar', title: 'Convertimos el proceso en una experiencia', body: 'Prototipamos flujos claros y priorizamos lo que genera valor desde la primera entrega.' },
  { step: '03', eyebrow: 'Construir', title: 'Integramos una base lista para crecer', body: 'Desarrollamos, conectamos servicios y validamos el sistema con casos reales de tu equipo.' },
  { step: '04', eyebrow: 'Mejorar', title: 'Acompañamos la evolución', body: 'Observamos el uso y refinamos la solución cuando aparecen nuevas necesidades.' },
]

const solutions = ['CRM y seguimiento comercial', 'Inventario y pedidos', 'Portales de clientes', 'Automatización administrativa', 'Dashboards e indicadores', 'Aplicaciones web a medida']
const trustPoints = ['Comunicación clara, sin tecnicismos innecesarios.', 'Arquitectura preparada para cambios y nuevas integraciones.', 'Experiencias simples para equipos técnicos y no técnicos.', 'Seguridad, roles y trazabilidad desde el diseño.']

const metrics = computed(() => [
  { value: '48h', label: 'para tu diagnóstico inicial' },
  { value: categories.value.length || '6+', label: 'áreas que podemos digitalizar' },
  { value: technologies.value.length || '10+', label: 'tecnologías para construir' },
])

function isMainLandingProject(project) {
  const slug = (project?.slug || '').toLowerCase()
  const title = (project?.title || '').toLowerCase()
  return slug === 'k' || slug.includes('kintiporta') || title.includes('kintiporta')
}

onMounted(async () => {
  try {
    const payload = await publicApi.getHomeData()
    categories.value = payload.categories || []
    technologies.value = payload.technologies || []
    landingProjects.value = payload.featuredProjects || []
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
    await nextTick()
    stopMotion = initLandingMotion(landingRoot.value)
  }
})

onBeforeUnmount(() => stopMotion())
</script>

<template>
  <main ref="landingRoot" class="landing-page">
    <section id="inicio" class="landing-hero">
      <div class="landing-container landing-hero__grid">
        <div class="landing-hero__copy">
          <div class="landing-kicker js-hero-reveal"><span></span> Software a medida · Ecuador</div>
          <h1 class="js-hero-reveal">Tu negocio no necesita más software. <em>Necesita uno que entienda cómo trabaja.</em></h1>
          <p class="landing-hero__lead js-hero-reveal">Convertimos tareas manuales, datos dispersos y procesos complejos en plataformas claras, automatizadas y construidas alrededor de tu empresa.</p>
          <div class="landing-hero__actions js-hero-reveal">
            <RouterLink class="landing-button landing-button--primary" :to="{ path: '/', hash: '#contacto' }">Cuéntanos tu proceso <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></RouterLink>
            <RouterLink class="landing-button landing-button--ghost" :to="{ path: '/', hash: '#proceso' }">Ver cómo lo hacemos</RouterLink>
          </div>
          <div class="landing-hero__proof js-hero-reveal">
            <div class="proof-avatars" aria-hidden="true"><span>SE</span><span>UX</span><span>DEV</span></div>
            <p><strong>Diseño + tecnología + negocio</strong><br />Un solo equipo para llevar tu idea a producción.</p>
          </div>
        </div>
        <div class="landing-hero__visual js-hero-reveal">
          <CircuitBoard />
          <div class="floating-chip floating-chip--top"><span></span> Flujo conectado</div>
          <div class="floating-chip floating-chip--bottom">+68% tiempo recuperado</div>
        </div>
      </div>
      <div class="landing-container metrics-strip js-reveal" aria-label="Indicadores de servicio">
        <article v-for="metric in metrics" :key="metric.label"><strong>{{ metric.value }}</strong><span>{{ metric.label }}</span></article>
        <p>Tu proceso es único.<br /><strong>La solución también debe serlo.</strong></p>
      </div>
    </section>

    <section id="conocenos" class="landing-section landing-section--impact">
      <div class="landing-container">
        <div class="section-heading section-heading--split js-reveal">
          <div><p class="section-kicker">Impacto tangible</p><h2>Menos fricción.<br /><em>Más negocio en movimiento.</em></h2></div>
          <p>No digitalizamos por moda. Diseñamos cada flujo para ahorrar tiempo, reducir errores y darte visibilidad donde hoy hay incertidumbre.</p>
        </div>
        <div class="impact-bento">
          <article v-for="card in impactCards" :key="card.number" class="impact-card js-reveal js-hover-card" :class="card.className">
            <div class="impact-card__top"><span>{{ card.number }}</span><i></i></div>
            <div class="impact-card__visual" :class="`impact-card__visual--${card.icon}`" aria-hidden="true"><span></span><span></span><span></span></div>
            <div><h3>{{ card.title }}</h3><p>{{ card.body }}</p></div>
          </article>
        </div>
      </div>
    </section>

    <section v-if="landingProjects.length" id="proyectos-destacados" class="landing-section landing-section--projects">
      <div class="landing-container">
        <div class="section-heading section-heading--split js-reveal">
          <div><p class="section-kicker">Trabajo visible</p><h2>Soluciones reales,<br /><em>listas para explorar.</em></h2></div>
          <RouterLink class="landing-text-link" to="/proyectos">Ver todos los proyectos <span>↗</span></RouterLink>
        </div>
        <div class="project-showcase">
          <article v-for="project in landingProjects" :key="project.publicId" class="project-showcase__card js-reveal js-hover-card">
            <div class="project-showcase__meta"><span>{{ project.categoryName || 'Software a medida' }}</span><small v-if="isMainLandingProject(project)">Producto principal</small></div>
            <div><h3>{{ project.title }}</h3><p>{{ project.shortDescription }}</p></div>
            <a :href="project.demoUrl" target="_blank" rel="noopener noreferrer">Abrir demo <span>↗</span></a>
          </article>
        </div>
      </div>
    </section>

    <section id="proceso" class="landing-section landing-section--process">
      <div class="landing-container">
        <div class="section-heading section-heading--center js-reveal"><p class="section-kicker">Un proceso claro</p><h2>De la conversación a una herramienta<br /><em>que tu equipo quiere usar.</em></h2></div>
        <div class="process-list">
          <article v-for="item in processSteps" :key="item.step" class="process-step js-reveal js-hover-card"><span class="process-step__number">{{ item.step }}</span><p class="process-step__eyebrow">{{ item.eyebrow }}</p><h3>{{ item.title }}</h3><p>{{ item.body }}</p></article>
        </div>
      </div>
    </section>

    <section id="servicios" class="landing-section landing-section--solutions">
      <div class="landing-container solutions-grid">
        <article class="solutions-copy js-reveal"><p class="section-kicker">Soluciones flexibles</p><h2>Construimos lo que tu operación <em>realmente necesita.</em></h2><p>Desde una herramienta puntual hasta una plataforma completa. Empezamos por el proceso con mayor impacto y creamos una base que pueda evolucionar.</p><RouterLink class="landing-button landing-button--primary" :to="{ path: '/', hash: '#contacto' }">Definir mi solución</RouterLink></article>
        <div class="solution-list js-reveal"><div v-for="(solution, index) in solutions" :key="solution" class="solution-row js-hover-card"><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ solution }}</strong><i>↗</i></div></div>
      </div>
    </section>

    <section id="tecnologias" class="landing-section landing-section--trust">
      <div class="landing-container trust-grid">
        <div class="trust-panel trust-panel--dark js-reveal"><p class="section-kicker">Cómo trabajamos</p><h2>Claridad en cada decisión. Criterio en cada entrega.</h2><ul><li v-for="item in trustPoints" :key="item"><span>✓</span>{{ item }}</li></ul></div>
        <div class="trust-panel trust-panel--light js-reveal"><p class="section-kicker">Capacidades conectadas</p><h3>Tecnología elegida por el problema, no por la tendencia.</h3><div v-if="loading" class="capability-state">Cargando capacidades…</div><div v-else-if="errorMessage" class="capability-state">{{ errorMessage }}</div><div v-else class="technology-cloud"><span v-for="technology in technologies" :key="technology.publicId">{{ technology.name }}</span><template v-if="!technologies.length"><span>Vue</span><span>Node.js</span><span>PostgreSQL</span><span>Integraciones API</span></template></div><p class="trust-panel__footnote">Web · Automatización · Datos · Integraciones · IA aplicada</p></div>
      </div>
    </section>

    <section id="contacto" class="landing-section landing-section--contact">
      <div class="landing-container contact-grid">
        <article class="contact-intro js-reveal"><p class="section-kicker">Tu siguiente paso</p><h2>Cuéntanos qué te quita tiempo.<br /><em>Nosotros diseñamos una mejor forma.</em></h2><p>No necesitas llegar con una especificación técnica. Háblanos del proceso, del problema y del resultado que esperas.</p><div class="contact-promise"><strong>48h</strong><span>para recibir un diagnóstico inicial y una ruta clara de implementación.</span></div></article>
        <div class="contact-form-wrap js-reveal"><LeadFormCard compact /></div>
      </div>
    </section>
  </main>
</template>

<style scoped src="../landing.css"></style>
