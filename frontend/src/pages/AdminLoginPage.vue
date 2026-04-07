<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { adminApi } from '../services/api'
import { appConfig } from '../services/config'
import { setAdminSessionToken } from '../utils/admin-session'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const errorMessage = ref('')
const credentials = ref({
  email: appConfig.defaultAdminEmail,
  password: '',
})

const highlights = [
  'Dashboard con metricas de visitantes, demos y conversion.',
  'Gestion de proyectos, categorias, tecnologias, usuarios y leads.',
  'Monitoreo de notificaciones, roles, permisos y auditoria.',
]

async function handleSubmit() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await adminApi.login(credentials.value)
    setAdminSessionToken(response.token)
    router.replace(route.query.redirect || '/admin/dashboard')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card auth-card--intro">
      <p class="section__eyebrow">Panel privado</p>
      <h1>Accede al centro operativo del portafolio digital.</h1>
      <p class="lead">
        Desde aqui el equipo interno administra demos, leads, metricas, notificaciones y trazas
        operativas sin mezclar la experiencia publica con la interna.
      </p>

      <ul class="bullet-list">
        <li v-for="item in highlights" :key="item">{{ item }}</li>
      </ul>

      <p class="auth-note">
        Si aun no configuraste una clave real en backend, primero genera la contrasena del admin y
        luego inicia sesion con ese usuario.
      </p>

      <div class="hero__actions">
        <RouterLink class="button button--secondary" to="/">Volver a la landing</RouterLink>
      </div>
    </section>

    <section class="auth-card">
      <p class="section__eyebrow">Autenticacion</p>
      <h2>Iniciar sesion</h2>
      <p>Usa una cuenta administrativa activa para entrar al backoffice.</p>

      <form class="lead-form auth-form" @submit.prevent="handleSubmit">
        <label class="lead-form__full">
          <span>Correo</span>
          <input v-model="credentials.email" type="email" required autocomplete="username" />
        </label>

        <label class="lead-form__full">
          <span>Contrasena</span>
          <input
            v-model="credentials.password"
            type="password"
            required
            autocomplete="current-password"
          />
        </label>

        <button class="button button--primary" type="submit" :disabled="loading">
          {{ loading ? 'Validando acceso...' : 'Entrar al panel' }}
        </button>

        <p class="auth-hint">
          Usuario sugerido: <strong>{{ appConfig.defaultAdminEmail }}</strong>
        </p>
        <p v-if="errorMessage" class="form-message form-message--error">{{ errorMessage }}</p>
      </form>
    </section>
  </main>
</template>
