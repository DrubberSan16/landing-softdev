<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import LeadFormCard from '../components/LeadFormCard.vue'
import ProjectCard from '../components/ProjectCard.vue'
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

const isMainProduct = computed(() => {
  const slug = (project.value?.slug || '').toLowerCase()
  const title = (project.value?.title || '').toLowerCase()

  return slug === 'k' || slug.includes('kintiporta') || title.includes('kintiporta')
})

const documentationContent = computed(() => project.value?.fullDescription?.trim() || '')
const documentationBlocks = computed(() => parseDocumentationBlocks(documentationContent.value))

function parseDocumentationBlocks(value) {
  const blocks = []
  let paragraph = []
  let listItems = []

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push({
        type: 'paragraph',
        text: paragraph.join(' '),
      })
      paragraph = []
    }
  }

  function flushList() {
    if (listItems.length) {
      blocks.push({
        type: 'list',
        items: listItems,
      })
      listItems = []
    }
  }

  value.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      return
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)

    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({
        type: `heading${heading[1].length}`,
        text: heading[2],
      })
      return
    }

    const listItem = trimmed.match(/^[-*]\s+(.+)$/)

    if (listItem) {
      flushParagraph()
      listItems.push(listItem[1])
      return
    }

    flushList()
    paragraph.push(trimmed)
  })

  flushParagraph()
  flushList()

  return blocks
}

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
          <span v-if="isMainProduct" class="project-main-badge">
            Producto principal de Software Easy Dev
          </span>
          <h1>{{ project.title }}</h1>
          <p class="lead">
            {{ project.shortDescription }}
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
          <p class="stack-card__label">
            {{ isMainProduct ? 'Producto principal' : 'Ficha ejecutiva' }}
          </p>
          <p v-if="isMainProduct" class="project-summary-card__intro">
            Demo desarrollado por Software Easy Dev para enseñar una experiencia real,
            presentable y lista para conversar con clientes.
          </p>
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

      <section v-if="documentationContent" class="section project-documentation">
        <div class="section__header">
          <p class="section__eyebrow">Documentación comercial</p>
          <h2>Contexto para presentar el demo con una narrativa clara.</h2>
          <p class="section__intro">
            Esta información resume qué hace el proyecto, por qué importa y cómo ayuda a
            conversar con un cliente interesado.
          </p>
        </div>

        <article class="info-card project-documentation__card">
          <template v-for="(block, index) in documentationBlocks" :key="`${block.type}-${index}`">
            <h3 v-if="block.type === 'heading1'" class="project-documentation__title">
              {{ block.text }}
            </h3>
            <h4 v-else-if="block.type === 'heading2'" class="project-documentation__subtitle">
              {{ block.text }}
            </h4>
            <h5 v-else-if="block.type === 'heading3'" class="project-documentation__minor-title">
              {{ block.text }}
            </h5>
            <ul v-else-if="block.type === 'list'" class="project-documentation__list">
              <li v-for="item in block.items" :key="item">{{ item }}</li>
            </ul>
            <p v-else class="project-documentation__paragraph">
              {{ block.text }}
            </p>
          </template>
        </article>
      </section>

      <section class="section">
        <div class="split-grid">
          <article class="info-card">
            <p class="section__eyebrow">Alcance del demo</p>
            <h2>Una muestra concreta de como podemos convertir una idea en software usable.</h2>
            <p>
              El demo no busca mostrar pantallas por mostrar. Sirve para que veas como tomamos un
              proceso real, lo ordenamos en pasos simples y lo convertimos en una plataforma que
              ayuda a vender, atender y tomar mejores decisiones.
            </p>

            <div class="demo-scope-grid">
              <div>
                <strong>Experiencia clara</strong>
                <span>Flujos pensados para que el usuario entienda que hacer desde el primer minuto.</span>
              </div>
              <div>
                <strong>Negocio visible</strong>
                <span>Informacion organizada para presentar mejor tu propuesta y reducir conversaciones confusas.</span>
              </div>
              <div>
                <strong>Base escalable</strong>
                <span>Una estructura que puede crecer con roles, reportes, automatizaciones e integraciones.</span>
              </div>
            </div>

            <p>
              Si tu empresa tiene un proceso que hoy vive entre mensajes, hojas de calculo o
              explicaciones repetidas, este tipo de demo muestra como podria verse una solucion
              propia: ordenada, medible y lista para tus clientes.
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
