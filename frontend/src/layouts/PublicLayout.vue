<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { appConfig } from '../services/config'

const navigation = [
  {
    label: 'Conocenos',
    to: { path: '/', hash: '#conocenos' },
  },
  {
    label: 'Servicios',
    to: { path: '/', hash: '#servicios' },
  },
  {
    label: 'Proyectos',
    to: { path: '/', hash: '#proyectos' },
  },
  {
    label: 'Tecnologias',
    to: { path: '/', hash: '#tecnologias' },
  },
  {
    label: 'Contacto',
    to: { path: '/', hash: '#contacto' },
  },
  {
    label: 'Login',
    to: { path: '/', hash: '#login-admin' },
    isLogin: true,
  },
]
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/">
        <span class="brand__media">
          <img class="brand__logo" src="/img/software-easy-dev-logo.svg" :alt="appConfig.appName" />
        </span>
      </RouterLink>

      <nav class="site-nav site-nav--landing">
        <RouterLink
          v-for="item in navigation"
          :key="item.label"
          class="site-nav__link"
          :class="{ 'site-nav__link--login': item.isLogin }"
          :to="item.to"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>

    <RouterView />

    <footer class="site-footer">
      <div class="site-footer__brand">
        <img class="site-footer__logo" src="/img/software-easy-dev-logo.svg" :alt="appConfig.appName" />
      </div>

      <div>
        <p>
          Plataforma comercial y operativa para exhibir demos, captar leads y gestionar
          el portafolio digital de una fabrica de software.
        </p>
      </div>

      <div class="site-footer__links">
        <RouterLink :to="{ path: '/', hash: '#conocenos' }">Conocenos</RouterLink>
        <RouterLink :to="{ path: '/', hash: '#proyectos' }">Proyectos</RouterLink>
        <RouterLink :to="{ path: '/', hash: '#contacto' }">Contacto</RouterLink>
        <RouterLink to="/admin/login">Login admin</RouterLink>
      </div>
    </footer>
  </div>
</template>
