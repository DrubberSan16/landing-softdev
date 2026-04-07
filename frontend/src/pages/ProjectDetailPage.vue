<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import LeadFormCard from '../components/LeadFormCard.vue'
import ProjectCard from '../components/ProjectCard.vue'
import StatCard from '../components/StatCard.vue'
import { usePublicTracking } from '../composables/usePublicTracking'
import { buildDemoRedirectUrl, publicApi } from '../services/api'
import { getSessionToken } from '../utils/visitor-session'

const route = useRoute()

usePublicTracking(() => ({
  projectSlug: route.params.slug,
}))

const loading = ref(true)
const project = ref(null)
const errorMessage = ref('')

const projectStats = computed(() => {
  if (!project.value) {
    return []
  }

  return [
    {
      label: 'Visitas',
      value: project.value.totalProjectViews || 0,
      caption: 'interacciones visibles sobre la landing',
    },
    {
      label: 'Clicks al demo',
      value: project.value.totalDemoClicks || 0,
      caption: 'interes real por la experiencia funcional',
    },
    {
      label: 'Visitantes unicos',
      value: project.value.totalUniqueVisitors || 0,
      caption: 'trafico distinto registrado',
    },
    {
      label: 'Leads',
      value: project.value.totalContactRequests || 0,
      caption: 'solicitudes asociadas al proyecto',
    },
  ]
})

const projectLeadOptions = computed(() => {
  if (!project.value) {
    return []
  }

  return [project.value, ...(project.value.relatedProjects || [])]
})

const demoRedirectUrl = computed(() => {
  if (!project.value?.slug || !project.value.demoUrl) {
    return ''
  }

  const referrerUrl = typeof window === 'undefined' ? '' : window.location.href
  return buildDemoRedirectUrl(project.value.slug, getSessionToken(), referrerUrl)
})

const galleryItems = computed(() => {
  if (!project.value?.media?.length) {
    return []
  }

  return project.value.media.filter((item) => item.fileUrl)
})

async function loadProject() {
  loading.value = true
  errorMessage.value = ''

  try {
    project.value = await publicApi.getProject(route.params.slug)
  } catch (error) {
    errorMessage.value = error.message
    project.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.slug,
  () => {
    loadProject()
  },
  { immediate: true },
)
</script>

<template>
  <main class="page-stack">
    <section v-if="loading" class="page-banner page-banner--soft">
      <p class="section__eyebrow">Detalle de proyecto</p>
      <h1>Cargando demo y contexto comercial...</h1>
    </section>

    <section v-else-if="errorMessage" class="page-banner page-banner--soft">
      <p class="section__eyebrow">Detalle no disponible</p>
      <h1>No fue posible cargar el proyecto.</h1>
      <p class="lead">{{ errorMessage }}</p>
      <div class="hero__actions">
        <RouterLink class="button button--primary" to="/proyectos">Volver al catalogo</RouterLink>
        <RouterLink class="button button--secondary" to="/contacto">
          Solicitar una propuesta
        </RouterLink>
      </div>
    </section>

    <template v-else-if="project">
      <section class="page-banner project-banner">
        <div class="project-banner__copy">
          <p class="section__eyebrow">{{ project.categoryName || 'Proyecto demo' }}</p>
          <h1>{{ project.title }}</h1>
          <p class="lead">
            {{ project.fullDescription || project.shortDescription }}
          </p>

          <div class="hero__actions">
            <a
              v-if="demoRedirectUrl"
              class="button button--primary"
              :href="demoRedirectUrl"
              target="_blank"
              rel="noreferrer"
            >
              Ver demo con tracking
            </a>
            <a
              v-if="project.documentationUrl"
              class="button button--secondary"
              :href="project.documentationUrl"
              target="_blank"
              rel="noreferrer"
            >
              Documentacion
            </a>
            <a
              v-if="project.videoUrl"
              class="button button--secondary"
              :href="project.videoUrl"
              target="_blank"
              rel="noreferrer"
            >
              Video
            </a>
          </div>
        </div>

        <aside class="stack-card stack-card--accent project-summary-card">
          <p class="stack-card__label">Ficha ejecutiva</p>
          <ul class="meta-list">
            <li>
              <span>Version</span>
              <strong>{{ project.versionLabel || 'No especificada' }}</strong>
            </li>
            <li>
              <span>Sector</span>
              <strong>{{ project.businessSector || 'Multiproposito' }}</strong>
            </li>
            <li>
              <span>Categoria</span>
              <strong>{{ project.categoryName || 'Sin categoria' }}</strong>
            </li>
            <li>
              <span>Cliente o caso</span>
              <strong>{{ project.clientName || 'Demo corporativa' }}</strong>
            </li>
          </ul>
        </aside>
      </section>

      <section class="section">
        <div class="hero__stats hero__stats--four">
          <StatCard
            v-for="stat in projectStats"
            :key="stat.label"
            :label="stat.label"
            :value="stat.value"
            :caption="stat.caption"
          />
        </div>
      </section>

      <section class="section">
        <div class="split-grid">
          <article class="info-card">
            <p class="section__eyebrow">Alcance del demo</p>
            <h2>Una experiencia preparada para vender la capacidad tecnica de la fabrica.</h2>
            <p>
              Este proyecto se presenta con una narrativa comercial completa: contexto de negocio,
              stack usado, activos visuales, documentacion y trazabilidad desde la vista hasta el
              lead.
            </p>

            <div v-if="project.technologies?.length" class="pill-cloud">
              <span v-for="technology in project.technologies" :key="technology.slug">
                {{ technology.name }}
              </span>
            </div>

            <div class="info-card__links">
              <a
                v-if="project.repositoryUrl"
                class="text-link"
                :href="project.repositoryUrl"
                target="_blank"
                rel="noreferrer"
              >
                Repositorio
              </a>
              <a
                v-if="project.demoUrl"
                class="text-link"
                :href="project.demoUrl"
                target="_blank"
                rel="noreferrer"
              >
                URL tecnica del demo
              </a>
            </div>
          </article>

          <LeadFormCard
            compact
            :projects="projectLeadOptions"
            :initial-project-slug="project.slug"
            title="Solicita un proyecto similar"
            description="Relaciona el lead con este demo para que el equipo comercial pueda medir interes y dar seguimiento desde el panel."
          />
        </div>
      </section>

      <section v-if="galleryItems.length" class="section section--alt">
        <div class="section__header">
          <p class="section__eyebrow">Medios y capturas</p>
          <h2>Recursos para reforzar la presentacion comercial del demo.</h2>
        </div>

        <div class="media-gallery">
          <article
            v-for="item in galleryItems"
            :key="`${item.id}-${item.fileUrl}`"
            class="media-card"
          >
            <img :src="item.thumbnailUrl || item.fileUrl" :alt="item.altText || project.title" />
            <div class="media-card__body">
              <strong>{{ item.title || project.title }}</strong>
              <p>{{ item.mediaType || 'media' }}</p>
            </div>
          </article>
        </div>
      </section>

      <section v-if="project.relatedProjects?.length" class="section">
        <div class="section__header section__header--inline">
          <div>
            <p class="section__eyebrow">Relacionados</p>
            <h2>Otros demos que ayudan a construir una propuesta mas completa.</h2>
          </div>
          <RouterLink class="text-link" to="/proyectos">Ver catalogo completo</RouterLink>
        </div>

        <div class="project-grid project-grid--compact">
          <ProjectCard
            v-for="related in project.relatedProjects"
            :key="related.publicId"
            :project="related"
            compact
          />
        </div>
      </section>
    </template>
  </main>
</template>
