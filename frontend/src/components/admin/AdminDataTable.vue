<script setup>
import { computed } from 'vue'

const props = defineProps({
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
    default: 'Registros',
  },
  items: {
    type: Array,
    default: () => [],
  },
  columns: {
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
  deletable: {
    type: Boolean,
    default: false,
  },
  toggleable: {
    type: Boolean,
    default: false,
  },
  actionLabel: {
    type: String,
    default: 'Editar',
  },
  busy: {
    type: Boolean,
    default: false,
  },
  createLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['create', 'edit', 'remove', 'toggle'])

const hasActions = computed(() => props.editable || props.deletable || props.toggleable)

function columnValue(column, item) {
  const value = typeof column.value === 'function' ? column.value(item) : item[column.key]

  if (value === null || value === undefined || value === '') {
    return column.empty || 'No registrado'
  }

  return value
}

function secondaryValue(column, item) {
  if (!column.secondary && !column.secondaryKey) {
    return ''
  }

  return typeof column.secondary === 'function'
    ? column.secondary(item)
    : item[column.secondaryKey]
}

function columnHref(column, item) {
  return typeof column.href === 'function' ? column.href(item) : column.href
}

function rowKey(item, index) {
  return item.publicId || item.id || item.slug || `${props.title}-${index}`
}
</script>

<template>
  <section class="admin-table-card">
    <div class="admin-panel-card__header">
      <div>
        <p class="section__eyebrow">{{ eyebrow }}</p>
        <h2>{{ title }}</h2>
      </div>
      <div class="admin-table-card__header-actions">
        <p v-if="subtitle">{{ subtitle }}</p>
        <button
          v-if="createLabel"
          class="button button--primary admin-table__create"
          type="button"
          :disabled="busy"
          @click="emit('create')"
        >
          {{ createLabel }}
        </button>
      </div>
    </div>

    <div v-if="items.length === 0" class="empty-state empty-state--soft">
      <p>{{ emptyMessage }}</p>
    </div>

    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key || column.label" scope="col">
              {{ column.label }}
            </th>
            <th v-if="hasActions" class="admin-table__actions-heading" scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="rowKey(item, index)">
            <td
              v-for="column in columns"
              :key="column.key || column.label"
              :class="[{ 'admin-table__cell--wide': column.wide }, column.class]"
            >
              <span v-if="column.type === 'status'" class="status-badge">
                {{ columnValue(column, item) }}
              </span>
              <a
                v-else-if="columnHref(column, item)"
                class="admin-table__link"
                :href="columnHref(column, item)"
                :target="column.external ? '_blank' : undefined"
                :rel="column.external ? 'noopener noreferrer' : undefined"
              >
                {{ columnValue(column, item) }}
              </a>
              <span
                v-else
                :class="{ 'admin-table__truncate': column.truncate }"
                :title="column.truncate ? String(columnValue(column, item)) : undefined"
              >
                {{ columnValue(column, item) }}
              </span>
              <small v-if="secondaryValue(column, item)">{{ secondaryValue(column, item) }}</small>
            </td>
            <td v-if="hasActions" class="admin-table__actions">
              <button
                v-if="editable && item.canEdit !== false"
                class="button button--secondary admin-table__button"
                type="button"
                :disabled="busy"
                @click="emit('edit', item)"
              >
                {{ item.actionLabel || actionLabel }}
              </button>
              <button
                v-if="toggleable && item.canToggle !== false"
                class="button button--secondary admin-table__button"
                type="button"
                :disabled="busy"
                @click="emit('toggle', item)"
              >
                {{ item.toggleLabel || 'Cambiar estado' }}
              </button>
              <button
                v-if="deletable && item.canDelete !== false"
                class="button button--danger admin-table__button"
                type="button"
                :disabled="busy"
                @click="emit('remove', item)"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
