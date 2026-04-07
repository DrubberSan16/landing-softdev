<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  caption: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <article class="stat-card">
    <p class="stat-card__label">{{ label }}</p>
    <strong class="stat-card__value">{{ value }}</strong>
    <span v-if="caption" class="stat-card__caption">{{ caption }}</span>
  </article>
</template>
