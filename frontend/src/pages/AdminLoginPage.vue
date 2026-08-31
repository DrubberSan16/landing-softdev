<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-vue-next'
import { adminApi } from '../services/api'
import { appConfig } from '../services/config'
import { setAdminSessionToken } from '../utils/admin-session'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
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
  <main class="auth-page auth-access">
    <section class="auth-card auth-card--intro auth-access__intro">
      <RouterLink class="auth-access__brand" to="/" aria-label="Volver a Software Easy Dev">
        <span>SE</span>
        <strong>Software Easy Dev</strong>
      </RouterLink>

      <div class="auth-access__copy">
        <p class="section__eyebrow">Centro de control</p>
        <h1>Todo tu ecosistema digital, en una sola vista.</h1>
        <p class="lead">
          Administra proyectos, oportunidades y rendimiento desde un entorno privado creado para
          tomar decisiones con claridad.
        </p>
      </div>

      <div class="auth-access__visual" aria-hidden="true">
        <div class="auth-access__orbit auth-access__orbit--one"></div>
        <div class="auth-access__orbit auth-access__orbit--two"></div>
        <div class="auth-access__core"><ShieldCheck :size="30" :stroke-width="1.6" /></div>
        <span class="auth-access__node auth-access__node--one">Portafolio</span>
        <span class="auth-access__node auth-access__node--two">Leads</span>
        <span class="auth-access__node auth-access__node--three">Métricas</span>
      </div>

      <ul class="auth-access__highlights">
        <li v-for="item in highlights" :key="item"><Check :size="16" aria-hidden="true" />{{ item }}</li>
      </ul>

      <RouterLink class="auth-access__back" to="/"><ArrowLeft :size="16" aria-hidden="true" /> Volver a la landing</RouterLink>
    </section>

    <section class="auth-card auth-access__form-card">
      <div class="auth-access__form-icon"><LockKeyhole :size="22" :stroke-width="1.8" aria-hidden="true" /></div>
      <p class="section__eyebrow">Acceso protegido</p>
      <h2>Bienvenido de nuevo</h2>
      <p class="lead">
        Ingresa con una cuenta administrativa activa para continuar.
      </p>

      <form class="lead-form auth-form" :aria-busy="loading" @submit.prevent="handleSubmit">
        <label class="lead-form__full" for="admin-email">
          <span>Correo</span>
          <input id="admin-email" v-model="credentials.email" type="email" required autocomplete="username" :aria-invalid="Boolean(errorMessage)" />
        </label>

        <label class="lead-form__full" for="admin-password">
          <span>Contrasena</span>
          <span class="auth-access__password">
            <input
              id="admin-password"
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              :aria-invalid="Boolean(errorMessage)"
              :aria-describedby="errorMessage ? 'admin-login-error' : undefined"
            />
            <button type="button" :aria-label="showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'" :aria-pressed="showPassword" @click="showPassword = !showPassword">
              <EyeOff v-if="showPassword" :size="18" aria-hidden="true" />
              <Eye v-else :size="18" aria-hidden="true" />
            </button>
          </span>
        </label>

        <button class="button button--primary" type="submit" :disabled="loading">
          {{ loading ? 'Validando acceso...' : 'Entrar al panel' }}
          <ArrowRight v-if="!loading" :size="17" aria-hidden="true" />
        </button>

        <p v-if="errorMessage" id="admin-login-error" class="form-message form-message--error" role="alert">{{ errorMessage }}</p>
      </form>

      <p class="auth-access__security"><ShieldCheck :size="15" aria-hidden="true" /> Conexión segura y sesión protegida.</p>
    </section>
  </main>
</template>
