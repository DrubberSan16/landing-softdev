<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { appConfig } from '../services/config'

const navigation = [
  {
    label: 'Inicio',
    to: { path: '/', hash: '#inicio' },
  },
  {
    label: 'Beneficios',
    to: { path: '/', hash: '#conocenos' },
  },
  {
    label: 'Proceso',
    to: { path: '/', hash: '#proceso' },
  },
  {
    label: 'Soluciones',
    to: { path: '/', hash: '#servicios' },
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
    to: { name: 'admin-login' },
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
          Software a medida para digitalizar procesos, automatizar tareas y ordenar la
          operacion de empresas que quieren crecer con tecnologia clara.
        </p>
      </div>

      <div class="site-footer__links">
        <RouterLink :to="{ path: '/', hash: '#conocenos' }">Beneficios</RouterLink>
        <RouterLink :to="{ path: '/', hash: '#proceso' }">Proceso</RouterLink>
        <RouterLink :to="{ path: '/', hash: '#contacto' }">Contacto</RouterLink>
        <RouterLink to="/admin/login">Login admin</RouterLink>
      </div>
    </footer>
  </div>
</template>
