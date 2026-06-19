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
  eyebrow: {
    type: String,
    default: 'Resumen',
  },
  items: {
    type: Array,
    default: () => [],
  },
  emptyMessage: {
    type: String,
    default: 'No hay registros para mostrar.',
  },
  editable: {
    type: Boolean,
    default: false,
  },
  actionLabel: {
    type: String,
    default: 'Editar',
  },
})

const emit = defineEmits(['edit'])
</script>

<template>
  <section class="admin-panel-card">
    <div class="admin-panel-card__header">
      <div>
        <p class="section__eyebrow">{{ eyebrow }}</p>
        <h2>{{ title }}</h2>
      </div>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="items.length === 0" class="empty-state empty-state--soft">
      <p>{{ emptyMessage }}</p>
    </div>

    <div v-else class="admin-list">
      <article
        v-for="(item, index) in items"
        :key="item.id || item.publicId || item.slug || item.label || index"
        class="admin-list__item"
      >
        <div class="admin-list__content">
          <div class="admin-list__heading">
            <strong>{{ item.title || item.fullName || item.name || item.label || item.subject }}</strong>
            <span v-if="item.badge" class="status-badge">{{ item.badge }}</span>
          </div>
          <p v-if="item.subtitle">{{ item.subtitle }}</p>
          <p v-else-if="item.description">{{ item.description }}</p>
          <p v-else-if="item.email">{{ item.email }}</p>
          <p v-else-if="item.status">{{ item.status }}</p>

          <dl v-if="item.details?.length" class="admin-list__details">
            <div v-for="detail in item.details" :key="`${detail.label}-${detail.value}`">
              <dt>{{ detail.label }}</dt>
              <dd>
                <a v-if="detail.href" :href="detail.href" :target="detail.external ? '_blank' : undefined" :rel="detail.external ? 'noopener noreferrer' : undefined">
                  {{ detail.value }}
                </a>
                <span v-else>{{ detail.value }}</span>
              </dd>
            </div>
          </dl>

          <div v-if="item.body" class="admin-list__message">
            <span>{{ item.bodyLabel || 'Detalle' }}</span>
            <p>{{ item.body }}</p>
          </div>

          <p v-if="item.note" class="admin-list__note">{{ item.note }}</p>
        </div>

        <div class="admin-list__meta">
          <strong v-if="item.value !== undefined" class="admin-list__value">{{ item.value }}</strong>
          <span v-else-if="item.slug">{{ item.slug }}</span>
          <button
            v-if="editable && item.canEdit !== false"
            class="button button--secondary admin-list__action"
            type="button"
            @click="emit('edit', item)"
          >
            {{ actionLabel }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
