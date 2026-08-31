<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  BarChart3,
  BellRing,
  Boxes,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  ExternalLink,
  FolderKanban,
  Gauge,
  Layers3,
  ListChecks,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tags,
  UsersRound,
} from 'lucide-vue-next'
import { adminApi } from '../services/api'
import { appConfig } from '../services/config'
import { clearAdminSessionToken } from '../utils/admin-session'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const admin = ref(null)
const errorMessage = ref('')
const sidebarOpen = ref(window.matchMedia('(min-width: 1181px)').matches)
const openMenuGroups = ref({
  portfolio: false,
  commercial: false,
  security: false,
  system: false,
})

const menuSections = [
  {
    type: 'item',
    label: 'Dashboard',
    description: 'Vista general',
    icon: Gauge,
    to: '/admin/dashboard',
  },
  {
    type: 'group',
    key: 'portfolio',
    label: 'Portafolio',
    description: 'Demos y contenido publico',
    icon: FolderKanban,
    children: [
      { label: 'Proyectos', description: 'Portafolio y demos', icon: Layers3, to: '/admin/proyectos' },
      { label: 'Categorias', description: 'Organiza el portafolio', icon: Tags, to: '/admin/categorias' },
      { label: 'Tecnologias', description: 'Stack de proyectos', icon: Boxes, to: '/admin/tecnologias' },
    ],
  },
  {
    type: 'group',
    key: 'commercial',
    label: 'Comercial',
    description: 'Embudo y rendimiento',
    icon: BarChart3,
    children: [
      { label: 'Solicitudes', description: 'Formularios de contacto', icon: ListChecks, to: '/admin/contactos' },
      { label: 'Rendimiento', description: 'Visitas y conversiones', icon: BarChart3, to: '/admin/metricas' },
    ],
  },
  {
    type: 'group',
    key: 'security',
    label: 'Administracion',
    description: 'Acceso y permisos',
    icon: ShieldCheck,
    children: [
      { label: 'Usuarios', description: 'Acceso administrativo', icon: UsersRound, to: '/admin/usuarios' },
      { label: 'Roles y permisos', description: 'Capacidades de acceso', icon: ShieldCheck, to: '/admin/roles' },
    ],
  },
  {
    type: 'group',
    key: 'system',
    label: 'Sistema',
    description: 'Mensajeria y auditoria',
    icon: Settings2,
    children: [
      { label: 'Notificaciones', description: 'Envios automaticos', icon: BellRing, to: '/admin/notificaciones' },
      { label: 'Auditoria', description: 'Historial de cambios', icon: CircleUserRound, to: '/admin/auditoria' },
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

function expandActiveMenu() {
  const activeGroup = menuSections.find((section) => section.type === 'group' && isMenuGroupActive(section))
  if (activeGroup) openMenuGroups.value[activeGroup.key] = true
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

watch(() => route.path, () => {
  expandActiveMenu()
  if (window.matchMedia('(max-width: 1180px)').matches) sidebarOpen.value = false
})

onMounted(() => {
  expandActiveMenu()
  loadProfile()
})
</script>

<template>
  <div class="admin-shell" :class="{ 'is-sidebar-collapsed': !sidebarOpen }">
    <a class="admin-skip-link" href="#admin-content">Saltar al contenido</a>
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
          <PanelLeftClose v-if="sidebarOpen" :size="18" aria-hidden="true" />
          <PanelLeftOpen v-else :size="18" aria-hidden="true" />
        </button>
      </div>

      <div class="admin-account-card">
        <span><i aria-hidden="true"></i> CUENTA ACTIVA</span>
        <strong>{{ admin?.email || 'Validando sesion...' }}</strong>
      </div>

      <div class="admin-welcome-link">
        <span class="admin-nav-icon"><Sparkles :size="17" aria-hidden="true" /></span>
        <span><strong>Centro de control</strong><small>Gestiona tu ecosistema</small></span>
      </div>

      <nav class="admin-nav" aria-label="Navegacion administrativa">
        <template v-for="section in menuSections" :key="section.key || section.to">
          <RouterLink v-if="section.type === 'item'" class="admin-nav-item" :class="{ 'is-active': isMenuItemActive(section.to) }" :to="section.to" :title="section.label">
            <span class="admin-nav-icon"><component :is="section.icon" :size="18" :stroke-width="1.8" aria-hidden="true" /></span>
            <span class="admin-nav-copy">
              <strong>{{ section.label }}</strong>
              <small>{{ section.description }}</small>
            </span>
          </RouterLink>

          <div v-else class="admin-nav-group" :class="{ 'is-open': isMenuGroupOpen(section.key), 'is-active': isMenuGroupActive(section) }">
            <button class="admin-nav-item admin-nav-item--group" type="button" :title="section.label" :aria-expanded="isMenuGroupOpen(section.key)" :aria-controls="`admin-menu-${section.key}`" @click="toggleMenuGroup(section.key)">
              <span class="admin-nav-icon"><component :is="section.icon" :size="18" :stroke-width="1.8" aria-hidden="true" /></span>
              <span class="admin-nav-copy">
                <strong>{{ section.label }}</strong>
                <small>{{ section.description }}</small>
              </span>
              <span class="admin-nav-caret"><ChevronUp v-if="isMenuGroupOpen(section.key)" :size="16" aria-hidden="true" /><ChevronDown v-else :size="16" aria-hidden="true" /></span>
            </button>

            <div v-if="isMenuGroupOpen(section.key)" :id="`admin-menu-${section.key}`" class="admin-nav-children">
              <RouterLink v-for="child in section.children" :key="child.to" class="admin-nav-child" :class="{ 'is-active': isMenuItemActive(child.to) }" :to="child.to" :title="child.label">
                <span class="admin-nav-child__icon"><component :is="child.icon" :size="16" :stroke-width="1.8" aria-hidden="true" /></span>
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
        <button class="button button--secondary" type="button" @click="handleLogout"><LogOut :size="16" aria-hidden="true" /> Cerrar sesion</button>
      </div>
    </aside>

    <main id="admin-content" class="admin-main">
      <div class="admin-topbar">
        <div>
          <p class="section__eyebrow">Panel privado</p>
          <strong>{{ activeModuleLabel }}</strong>
        </div>
        <div class="admin-topbar__actions">
          <RouterLink class="button button--secondary" to="/" target="_blank" rel="noopener noreferrer">Ver sitio <ExternalLink :size="15" aria-hidden="true" /></RouterLink>
          <button class="button button--secondary" type="button" @click="toggleSidebar">
            <PanelLeftClose v-if="sidebarOpen" :size="16" aria-hidden="true" />
            <PanelLeftOpen v-else :size="16" aria-hidden="true" />
            {{ sidebarOpen ? 'Ocultar menu' : 'Mostrar menu' }}
          </button>
        </div>
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
