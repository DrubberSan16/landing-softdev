<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import ProjectCard from '../components/ProjectCard.vue'
import { usePublicTracking } from '../composables/usePublicTracking'
import { publicApi } from '../services/api'

usePublicTracking()

const filters = ref({
  search: '',
  categorySlug: '',
  technologySlug: '',
})

const loading = ref(true)
const projects = ref([])
const categories = ref([])
const technologies = ref([])
const meta = ref({ total: 0 })
const errorMessage = ref('')

const hasFilters = computed(
  () => filters.value.search || filters.value.categorySlug || filters.value.technologySlug,
)

async function loadCatalog() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [projectsPayload, categoriesPayload, technologiesPayload] = await Promise.all([
      publicApi.getProjects({
        page: 1,
        limit: 24,
        ...filters.value,
      }),
      publicApi.getCategories(),
      publicApi.getTechnologies(),
    ])

    projects.value = projectsPayload.items || []
    meta.value = projectsPayload.meta || { total: 0 }
    categories.value = categoriesPayload || []
    technologies.value = technologiesPayload || []
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  filters.value = {
    search: '',
    categorySlug: '',
    technologySlug: '',
  }
}

watch(filters, loadCatalog, { deep: true })
onMounted(loadCatalog)
</script>

<template>
  <main class="page-stack">
    <section class="page-banner">
      <p class="section__eyebrow">Catalogo de proyectos</p>
      <h1>Explora demos publicados por categoria, tecnologia e interes comercial.</h1>
      <p class="lead">
        Cada proyecto se presenta como un activo funcional con contexto, stack y puntos claros
        de conversion para demos o propuestas similares.
      </p>
    </section>

    <section class="section">
      <div class="filter-bar">
        <label>
          <span>Buscar</span>
          <input v-model="filters.search" placeholder="ERP, dashboard, e-commerce..." />
        </label>

        <label>
          <span>Categoria</span>
          <select v-model="filters.categorySlug">
            <option value="">Todas</option>
            <option v-for="category in categories" :key="category.publicId" :value="category.slug">
              {{ category.name }}
            </option>
          </select>
        </label>

        <label>
          <span>Tecnologia</span>
          <select v-model="filters.technologySlug">
            <option value="">Todas</option>
            <option
              v-for="technology in technologies"
              :key="technology.publicId"
              :value="technology.slug"
            >
              {{ technology.name }}
            </option>
          </select>
        </label>

        <button v-if="hasFilters" class="button button--secondary" type="button" @click="clearFilters">
          Limpiar filtros
        </button>
      </div>

      <div class="section__header section__header--inline">
        <h2>{{ meta.total || projects.length }} demos encontrados</h2>
      </div>

      <div v-if="loading" class="empty-state">
        <p>Cargando catalogo...</p>
      </div>

      <div v-else-if="errorMessage" class="empty-state">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else-if="projects.length === 0" class="empty-state">
        <p>No hay demos que coincidan con esos filtros.</p>
      </div>

      <div v-else class="project-grid">
        <ProjectCard v-for="project in projects" :key="project.publicId" :project="project" />
      </div>
    </section>
  </main>
</template>
