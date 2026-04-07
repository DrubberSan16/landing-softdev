<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
  emptyMessage: {
    type: String,
    default: 'No hay registros para mostrar.',
  },
})
</script>

<template>
  <section class="admin-panel-card">
    <div class="admin-panel-card__header">
      <div>
        <p class="section__eyebrow">Modulo</p>
        <h2>{{ title }}</h2>
      </div>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="items.length === 0" class="empty-state empty-state--soft">
      <p>{{ emptyMessage }}</p>
    </div>

    <div v-else class="admin-list">
      <article
        v-for="item in items"
        :key="item.id || item.publicId || item.slug || item.label"
        class="admin-list__item"
      >
        <div class="admin-list__content">
          <strong>{{ item.title || item.fullName || item.name || item.label || item.subject }}</strong>
          <p v-if="item.subtitle">{{ item.subtitle }}</p>
          <p v-else-if="item.description">{{ item.description }}</p>
          <p v-else-if="item.email">{{ item.email }}</p>
          <p v-else-if="item.status">{{ item.status }}</p>
        </div>

        <div class="admin-list__meta">
          <span v-if="item.badge" class="status-badge">{{ item.badge }}</span>
          <span v-else-if="item.value !== undefined">{{ item.value }}</span>
          <span v-else-if="item.slug">{{ item.slug }}</span>
        </div>
      </article>
    </div>
  </section>
</template>
