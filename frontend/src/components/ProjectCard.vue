<script setup>
import { RouterLink } from 'vue-router'
import { computed } from 'vue'
import { buildDemoRedirectUrl } from '../services/api'
import { getSessionToken } from '../utils/visitor-session'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const demoLink = computed(() => {
  if (!props.project.demoUrl || !props.project.slug) {
    return ''
  }

  const referrerUrl = typeof window === 'undefined' ? '' : window.location.href
  return buildDemoRedirectUrl(props.project.slug, getSessionToken(), referrerUrl)
})
</script>

<template>
  <article class="project-card" :class="{ 'project-card--compact': compact }">
    <div class="project-card__cover">
      <img
        v-if="project.coverImageUrl"
        :src="project.coverImageUrl"
        :alt="project.title"
        loading="lazy"
      />
      <div v-else class="project-card__placeholder">
        <span>{{ project.title?.slice(0, 2).toUpperCase() }}</span>
      </div>
    </div>

    <div class="project-card__body">
      <div class="project-card__meta">
        <span>{{ project.categoryName || 'Demo' }}</span>
        <span v-if="project.versionLabel">{{ project.versionLabel }}</span>
      </div>

      <h3>{{ project.title }}</h3>
      <p>{{ project.shortDescription }}</p>

      <div v-if="project.technologies?.length" class="tag-list">
        <span v-for="technology in project.technologies.slice(0, 4)" :key="technology.slug">
          {{ technology.name }}
        </span>
      </div>

      <div class="project-card__actions">
        <RouterLink class="button button--secondary" :to="`/proyectos/${project.slug}`">
          Ver detalle
        </RouterLink>
        <a
          v-if="demoLink"
          class="text-link"
          :href="demoLink"
          target="_blank"
          rel="noreferrer"
        >
          Demo directa
        </a>
      </div>
    </div>
  </article>
</template>
