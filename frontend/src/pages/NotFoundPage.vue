<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="not-found-page">
    <section class="empty-state empty-state--large">
      <p class="section__eyebrow">404</p>
      <h1>La ruta que buscas no existe en esta plataforma.</h1>
      <p>
        Puedes volver a la landing publica, revisar el catalogo de proyectos o entrar al panel
        administrativo si ya cuentas con acceso.
      </p>

      <div class="hero__actions">
        <RouterLink class="button button--primary" to="/">Ir al inicio</RouterLink>
        <RouterLink class="button button--secondary" to="/proyectos">Ver proyectos</RouterLink>
        <RouterLink class="button button--secondary" to="/admin/login">Admin login</RouterLink>
      </div>
    </section>
  </main>
</template>
