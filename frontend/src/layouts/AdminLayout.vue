<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { adminApi } from '../services/api'
import { appConfig } from '../services/config'
import { clearAdminSessionToken } from '../utils/admin-session'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const admin = ref(null)
const errorMessage = ref('')
const sidebarOpen = ref(true)
const openMenuGroups = ref({
  portfolio: true,
  commercial: true,
  security: true,
  system: true,
})

const menuSections = [
  {
    type: 'item',
    label: 'Dashboard',
    description: 'Componente Dashboard',
    icon: 'DB',
    to: '/admin/dashboard',
  },
  {
    type: 'group',
    key: 'portfolio',
    label: 'Portafolio',
    description: 'Demos y contenido publico',
    icon: 'PO',
    children: [
      { label: 'Proyectos', description: 'Portafolio y demos', icon: 'PR', to: '/admin/proyectos' },
      { label: 'Categorias', description: 'Organiza el portafolio', icon: 'CA', to: '/admin/categorias' },
      { label: 'Tecnologias', description: 'Stack de proyectos', icon: 'TE', to: '/admin/tecnologias' },
    ],
  },
  {
    type: 'group',
    key: 'commercial',
    label: 'Comercial',
    description: 'Embudo y rendimiento',
    icon: 'CO',
    children: [
      { label: 'Solicitudes', description: 'Formularios de Contactenos', icon: 'SO', to: '/admin/contactos' },
      { label: 'Rendimiento', description: 'Visitas y conversiones', icon: 'RE', to: '/admin/metricas' },
    ],
  },
  {
    type: 'group',
    key: 'security',
    label: 'Administracion',
    description: 'Acceso y permisos',
    icon: 'AD',
    children: [
      { label: 'Usuarios', description: 'Acceso administrativo', icon: 'US', to: '/admin/usuarios' },
      { label: 'Roles y permisos', description: 'Capacidades de acceso', icon: 'RO', to: '/admin/roles' },
    ],
  },
  {
    type: 'group',
    key: 'system',
    label: 'Sistema',
    description: 'Mensajeria y auditoria',
    icon: 'SI',
    children: [
      { label: 'Notificaciones', description: 'Envios automaticos', icon: 'NO', to: '/admin/notificaciones' },
      { label: 'Auditoria', description: 'Historial de cambios', icon: 'AU', to: '/admin/auditoria' },
    ],
  },
]

const activePath = computed(() => route.path)
const activeModuleLabel = computed(() => {
  for (const section of menuSections) {
    if (section.type === 'item' && isMenuItemActive(section.to)) {
      return section.label
    }

    const child = section.children?.find((item) => isMenuItemActive(item.to))

    if (child) {
      return child.label
    }
  }

  return 'Panel privado'
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function toggleMenuGroup(groupKey) {
  openMenuGroups.value[groupKey] = !openMenuGroups.value[groupKey]
}

function isMenuGroupOpen(groupKey) {
  return Boolean(openMenuGroups.value[groupKey])
}

function isMenuItemActive(path) {
  return activePath.value.startsWith(path)
}

function isMenuGroupActive(section) {
  return section.children?.some((item) => isMenuItemActive(item.to))
}

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
  <div class="admin-shell" :class="{ 'is-sidebar-collapsed': !sidebarOpen }">
    <aside class="admin-sidebar" :aria-expanded="sidebarOpen">
      <div class="admin-sidebar__top">
        <RouterLink class="admin-profile" to="/admin/dashboard">
          <span class="admin-profile__logo">
            <img src="/img/software-easy-dev-logo.svg" :alt="appConfig.appName" />
          </span>
          <span class="admin-profile__text">
            <strong>Software Easy Dev</strong>
            <small>{{ admin?.fullName || 'Panel privado' }}</small>
          </span>
        </RouterLink>

        <button class="admin-sidebar-toggle" type="button" :aria-label="sidebarOpen ? 'Cerrar menu' : 'Abrir menu'" @click="toggleSidebar">
          <span>{{ sidebarOpen ? 'Cerrar' : 'Abrir' }}</span>
          <b>{{ sidebarOpen ? '-' : '+' }}</b>
        </button>
      </div>

      <div class="admin-account-card">
        <span>CUENTA ACTIVA</span>
        <strong>{{ admin?.email || 'Validando sesion...' }}</strong>
      </div>

      <div class="admin-welcome-link">
        <span class="admin-nav-icon">IN</span>
        <strong>Bienvenid@</strong>
      </div>

      <nav class="admin-nav" aria-label="Navegacion administrativa">
        <template v-for="section in menuSections" :key="section.key || section.to">
          <RouterLink v-if="section.type === 'item'" class="admin-nav-item" :class="{ 'is-active': isMenuItemActive(section.to) }" :to="section.to" :title="section.label">
            <span class="admin-nav-icon">{{ section.icon }}</span>
            <span class="admin-nav-copy">
              <strong>{{ section.label }}</strong>
              <small>{{ section.description }}</small>
            </span>
          </RouterLink>

          <div v-else class="admin-nav-group" :class="{ 'is-open': isMenuGroupOpen(section.key), 'is-active': isMenuGroupActive(section) }">
            <button class="admin-nav-item admin-nav-item--group" type="button" :title="section.label" @click="toggleMenuGroup(section.key)">
              <span class="admin-nav-icon">{{ section.icon }}</span>
              <span class="admin-nav-copy">
                <strong>{{ section.label }}</strong>
                <small>{{ section.description }}</small>
              </span>
              <span class="admin-nav-caret">{{ isMenuGroupOpen(section.key) ? '^' : 'v' }}</span>
            </button>

            <div v-if="isMenuGroupOpen(section.key)" class="admin-nav-children">
              <RouterLink v-for="child in section.children" :key="child.to" class="admin-nav-child" :class="{ 'is-active': isMenuItemActive(child.to) }" :to="child.to" :title="child.label">
                <span class="admin-nav-child__icon">{{ child.icon }}</span>
                <span>
                  <strong>{{ child.label }}</strong>
                  <small>{{ child.description }}</small>
                </span>
              </RouterLink>
            </div>
          </div>
        </template>
      </nav>

      <div class="admin-sidebar-session" v-if="admin">
        <span>Sesion</span>
        <strong>{{ admin.fullName }}</strong>
        <button class="button button--secondary" type="button" @click="handleLogout">Cerrar sesion</button>
      </div>
    </aside>

    <main class="admin-main">
      <div class="admin-topbar">
        <div>
          <p class="section__eyebrow">Panel privado</p>
          <strong>{{ activeModuleLabel }}</strong>
        </div>
        <button class="button button--secondary" type="button" @click="toggleSidebar">
          {{ sidebarOpen ? 'Ocultar menu' : 'Mostrar menu' }}
        </button>
      </div>

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
