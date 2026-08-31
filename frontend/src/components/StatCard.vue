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
  icon: {
    type: [Object, Function],
    default: null,
  },
  tone: {
    type: String,
    default: 'blue',
  },
})
</script>

<template>
  <article class="stat-card" :class="`stat-card--${tone}`">
    <div class="stat-card__top">
      <p class="stat-card__label">{{ label }}</p>
      <span v-if="icon" class="stat-card__icon"><component :is="icon" :size="18" :stroke-width="1.8" aria-hidden="true" /></span>
    </div>
    <strong class="stat-card__value">{{ value }}</strong>
    <span v-if="caption" class="stat-card__caption">{{ caption }}</span>
  </article>
</template>
