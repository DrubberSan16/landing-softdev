<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { adminApi } from '../services/api'
import { appConfig } from '../services/config'
import { clearAdminSessionToken } from '../utils/admin-session'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const admin = ref(null)
const errorMessage = ref('')

const navigation = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Proyectos', to: '/admin/proyectos' },
  { label: 'Categorias', to: '/admin/categorias' },
  { label: 'Tecnologias', to: '/admin/tecnologias' },
  { label: 'Contactos', to: '/admin/contactos' },
  { label: 'Metricas', to: '/admin/metricas' },
  { label: 'Usuarios', to: '/admin/usuarios' },
  { label: 'Roles', to: '/admin/roles' },
  { label: 'Notificaciones', to: '/admin/notificaciones' },
  { label: 'Auditoria', to: '/admin/auditoria' },
]

const activePath = computed(() => route.path)

async function loadProfile() {
  loading.value = true
  errorMessage.value = ''

  try {
    admin.value = await adminApi.me()
  } catch (error) {
    clearAdminSessionToken()
    errorMessage.value = error.message
    router.replace('/admin/login')
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  try {
    await adminApi.logout()
  } catch (error) {
    console.warn('No se pudo cerrar la sesion en el backend.', error)
  } finally {
    clearAdminSessionToken()
    router.replace('/admin/login')
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <RouterLink class="brand brand--admin" to="/admin/dashboard">
        <span class="brand__media">
          <img class="brand__logo brand__logo--admin" src="/img/software-easy-dev-logo.svg" :alt="appConfig.appName" />
        </span>
      </RouterLink>

      <p class="brand__chip">Panel privado</p>

      <div class="admin-sidebar__section">
        <p class="admin-sidebar__eyebrow">Navegacion</p>
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          class="admin-sidebar__link"
          :class="{ 'is-active': activePath.startsWith(item.to) }"
          :to="item.to"
        >
          {{ item.label }}
        </RouterLink>
      </div>

      <div class="admin-sidebar__section admin-sidebar__profile" v-if="admin">
        <p class="admin-sidebar__eyebrow">Sesion</p>
        <strong>{{ admin.fullName }}</strong>
        <span>{{ admin.email }}</span>
        <button class="button button--secondary" type="button" @click="handleLogout">
          Cerrar sesion
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <div v-if="loading" class="empty-state">
        <h2>Validando sesion administrativa...</h2>
      </div>

      <div v-else-if="errorMessage" class="empty-state">
        <h2>No fue posible cargar el panel.</h2>
        <p>{{ errorMessage }}</p>
      </div>

      <RouterView v-else />
    </main>
  </div>
</template>
