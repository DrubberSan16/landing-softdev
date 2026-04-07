<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPanelList from '../components/admin/AdminPanelList.vue'
import StatCard from '../components/StatCard.vue'
import { adminApi } from '../services/api'

const route = useRoute()
const loading = ref(true)
const errorMessage = ref('')
const moduleState = ref({
  eyebrow: '',
  title: '',
  description: '',
  stats: [],
  sections: [],
})

function formatDate(value) {
  if (!value) {
    return 'sin fecha'
  }

  return new Date(value).toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function buildStats(definitions) {
  return definitions.map((item) => ({
    label: item.label,
    value: item.value,
    caption: item.caption,
  }))
}

async function loadProjectsModule() {
  const payload = await adminApi.getProjects({ page: 1, limit: 12 })
  const items = payload.items || []

  return {
    eyebrow: 'Gestion editorial',
    title: 'Proyectos demo',
    description: 'Catalogo interno para publicar, ordenar y analizar demos desde el panel.',
    stats: buildStats([
      { label: 'Total listado', value: payload.meta?.total || items.length, caption: 'proyectos registrados' },
      { label: 'Publicados', value: items.filter((item) => item.status === 'published').length, caption: 'visibles o listos para publicar' },
      { label: 'Destacados', value: items.filter((item) => item.isFeatured).length, caption: 'priorizados en la landing' },
    ]),
    sections: [
      {
        title: 'Proyectos recientes',
        subtitle: 'Vista rapida del portafolio administrado.',
        items: items.map((item) => ({
          ...item,
          subtitle: `${item.categoryName || 'Sin categoria'} | ${item.visibility || 'public'} | ${item.versionLabel || 'sin version'}`,
          badge: item.status,
        })),
        emptyMessage: 'Aun no existen proyectos cargados.',
      },
    ],
  }
}

async function loadCategoriesModule() {
  const items = await adminApi.getCategories()

  return {
    eyebrow: 'Organizacion',
    title: 'Categorias',
    description: 'Agrupa el portafolio por tipologia para mejorar navegacion publica y control editorial.',
    stats: buildStats([
      { label: 'Categorias', value: items.length, caption: 'agrupadores del catalogo' },
      { label: 'Activas', value: items.filter((item) => item.status).length, caption: 'visibles para la landing' },
      { label: 'Inactivas', value: items.filter((item) => !item.status).length, caption: 'reservadas o en revision' },
    ]),
    sections: [
      {
        title: 'Listado actual',
        subtitle: 'Categorias ordenadas segun la configuracion del panel.',
        items: items.map((item) => ({
          ...item,
          title: item.name,
          subtitle: item.description || `slug: ${item.slug}`,
          badge: item.status ? 'activa' : 'inactiva',
        })),
        emptyMessage: 'No hay categorias creadas.',
      },
    ],
  }
}

async function loadTechnologiesModule() {
  const items = await adminApi.getTechnologies()

  return {
    eyebrow: 'Capacidad tecnica',
    title: 'Tecnologias',
    description: 'Stack visible para mostrar expertise tecnico en proyectos y landing.',
    stats: buildStats([
      { label: 'Tecnologias', value: items.length, caption: 'stack registrado' },
      { label: 'Activas', value: items.filter((item) => item.status).length, caption: 'habilitadas para uso' },
      { label: 'Con URL oficial', value: items.filter((item) => item.officialUrl).length, caption: 'referencias externas definidas' },
    ]),
    sections: [
      {
        title: 'Stack administrado',
        subtitle: 'Tecnologias disponibles para asociar a demos.',
        items: items.map((item) => ({
          ...item,
          title: item.name,
          subtitle: item.description || item.slug,
          badge: item.colorHex || (item.status ? 'activa' : 'inactiva'),
        })),
        emptyMessage: 'No hay tecnologias creadas.',
      },
    ],
  }
}

async function loadContactsModule() {
  const payload = await adminApi.getContacts({ page: 1, limit: 12 })
  const items = payload.items || []

  return {
    eyebrow: 'Embudo comercial',
    title: 'Contactos y leads',
    description: 'Solicitudes recibidas desde la landing para seguimiento interno y conversion.',
    stats: buildStats([
      { label: 'Total leads', value: payload.meta?.total || items.length, caption: 'solicitudes registradas' },
      { label: 'Nuevos', value: items.filter((item) => item.status === 'new').length, caption: 'pendientes de atencion' },
      { label: 'Asignados', value: items.filter((item) => item.assignedToPublicId).length, caption: 'ya tienen responsable interno' },
    ]),
    sections: [
      {
        title: 'Solicitudes recientes',
        subtitle: 'Entrada comercial capturada por el formulario publico.',
        items: items.map((item) => ({
          ...item,
          title: item.fullName,
          subtitle: `${item.projectTitle || 'Lead general'} | ${item.email} | ${formatDate(item.createdAt)}`,
          badge: item.status,
        })),
        emptyMessage: 'Todavia no se reciben solicitudes.',
      },
    ],
  }
}

async function loadUsersModule() {
  const [payload, roles] = await Promise.all([
    adminApi.getUsers({ page: 1, limit: 12 }),
    adminApi.getRoles(),
  ])
  const items = payload.items || []

  return {
    eyebrow: 'Control de acceso',
    title: 'Usuarios administrativos',
    description: 'Equipo interno con acceso al panel, roles asignados y politicas de sesion.',
    stats: buildStats([
      { label: 'Usuarios', value: payload.meta?.total || items.length, caption: 'cuentas administrativas' },
      { label: 'Activos', value: items.filter((item) => item.status === 'active').length, caption: 'habilitados para operar' },
      { label: 'Roles', value: roles.length, caption: 'perfiles disponibles en el sistema' },
    ]),
    sections: [
      {
        title: 'Usuarios recientes',
        subtitle: 'Vista rapida de acceso interno y asignacion de roles.',
        items: items.map((item) => ({
          ...item,
          subtitle: `${item.email} | ${item.roles?.map((role) => role.name).join(', ') || 'sin roles'} | ultimo acceso ${item.lastLoginAt ? formatDate(item.lastLoginAt) : 'sin registro'}`,
          badge: item.status,
        })),
        emptyMessage: 'No hay usuarios administrativos registrados.',
      },
      {
        title: 'Roles disponibles',
        subtitle: 'Perfiles que pueden asignarse a los usuarios.',
        items: roles.map((item) => ({
          ...item,
          title: item.name,
          subtitle: item.description || item.code,
          badge: `${item.permissions?.length || 0} permisos`,
        })),
        emptyMessage: 'No hay roles configurados.',
      },
    ],
  }
}

async function loadRolesModule() {
  const [roles, permissions] = await Promise.all([adminApi.getRoles(), adminApi.getPermissions()])

  return {
    eyebrow: 'Seguridad operativa',
    title: 'Roles y permisos',
    description: 'Modelo de autorizacion para separar capacidades entre administradores, editores y analistas.',
    stats: buildStats([
      { label: 'Roles', value: roles.length, caption: 'perfiles del panel' },
      { label: 'Sistema', value: roles.filter((item) => item.isSystem).length, caption: 'roles base del esquema' },
      { label: 'Permisos', value: permissions.length, caption: 'acciones disponibles para asignacion' },
    ]),
    sections: [
      {
        title: 'Roles registrados',
        subtitle: 'Cada rol agrega una combinacion de permisos operativos.',
        items: roles.map((item) => ({
          ...item,
          title: item.name,
          subtitle: item.description || item.code,
          badge: `${item.permissions?.length || 0} permisos`,
        })),
        emptyMessage: 'No hay roles disponibles.',
      },
      {
        title: 'Catalogo de permisos',
        subtitle: 'Permisos utilizables para construir reglas de acceso.',
        items: permissions.map((item) => ({
          ...item,
          title: item.code,
          subtitle: `${item.moduleName} | ${item.actionName}`,
          badge: item.description || 'permiso',
        })),
        emptyMessage: 'No hay permisos configurados.',
      },
    ],
  }
}

async function loadMetricsModule() {
  const [siteMetrics, projectMetrics, topDemoClicks] = await Promise.all([
    adminApi.getSiteMetrics(),
    adminApi.getProjectMetrics(),
    adminApi.getTopDemoClicks(),
  ])

  return {
    eyebrow: 'Analitica',
    title: 'Metricas de negocio',
    description: 'Lectura consolidada de alcance, interes por demos y conversion por proyecto.',
    stats: buildStats([
      { label: 'Visitantes unicos', value: siteMetrics.totalUniqueVisitorsSite || 0, caption: 'alcance total del sitio' },
      { label: 'Proyectos publicados', value: siteMetrics.publishedProjects || 0, caption: 'catalogo visible' },
      { label: 'Clicks demo', value: siteMetrics.totalDemoClicksSite || 0, caption: 'accion hacia demos' },
    ]),
    sections: [
      {
        title: 'Metricas por proyecto',
        subtitle: 'Conversion y desempeno de cada demo.',
        items: projectMetrics.map((item) => ({
          ...item,
          title: item.title,
          subtitle: `${item.totalProjectViews || 0} vistas | ${item.totalUniqueVisitors || 0} unicos | ${item.totalContactRequests || 0} leads`,
          badge: `${item.conversionRate || 0}% conversion`,
        })),
        emptyMessage: 'No hay metricas por proyecto aun.',
      },
      {
        title: 'Top de clicks al demo',
        subtitle: 'Demos con mayor intencion de exploracion funcional.',
        items: topDemoClicks.map((item) => ({
          ...item,
          title: item.title,
          subtitle: item.slug,
          badge: `${item.totalClicks || 0} clicks`,
        })),
        emptyMessage: 'No hay clicks registrados.',
      },
    ],
  }
}

async function loadNotificationsModule() {
  const [queuePayload, channels, templates, preferences] = await Promise.all([
    adminApi.getNotificationQueue({ page: 1, limit: 12 }),
    adminApi.getNotificationChannels(),
    adminApi.getNotificationTemplates(),
    adminApi.getNotificationPreferences(),
  ])
  const queue = queuePayload.items || []

  return {
    eyebrow: 'Alertas y seguimiento',
    title: 'Notificaciones',
    description: 'Cola, canales, plantillas y preferencias para reaccionar ante eventos del negocio.',
    stats: buildStats([
      { label: 'En cola', value: queuePayload.meta?.total || queue.length, caption: 'items recientes de notificacion' },
      { label: 'Canales', value: channels.length, caption: 'mecanismos configurados' },
      { label: 'Plantillas', value: templates.length, caption: 'mensajes automaticos disponibles' },
    ]),
    sections: [
      {
        title: 'Cola reciente',
        subtitle: 'Eventos que esperan envio o ya fueron procesados.',
        items: queue.map((item) => ({
          ...item,
          title: item.eventCode,
          subtitle: `${item.channelName} | ${item.recipientTo || 'sin destinatario'} | ${formatDate(item.createdAt)}`,
          badge: item.status,
        })),
        emptyMessage: 'No hay items en cola.',
      },
      {
        title: 'Canales y plantillas',
        subtitle: 'Base de entrega automatica definida en el sistema.',
        items: [
          ...channels.map((item) => ({
            ...item,
            title: item.name,
            subtitle: item.description || item.code,
            badge: item.isActive ? 'activo' : 'inactivo',
          })),
          ...templates.slice(0, 6).map((item) => ({
            ...item,
            title: item.name,
            subtitle: `${item.eventCode} | ${item.channelName}`,
            badge: item.isActive ? 'activa' : 'inactiva',
          })),
        ],
        emptyMessage: 'No hay canales ni plantillas configuradas.',
      },
      {
        title: 'Preferencias administrativas',
        subtitle: 'Configuracion por usuario y canal para eventos del sistema.',
        items: preferences.slice(0, 12).map((item) => ({
          ...item,
          title: item.adminUserFullName,
          subtitle: `${item.eventCode} | ${item.channelName}`,
          badge: item.isEnabled ? 'habilitada' : 'deshabilitada',
        })),
        emptyMessage: 'No hay preferencias definidas.',
      },
    ],
  }
}

async function loadAuditModule() {
  const payload = await adminApi.getAuditLogs({ page: 1, limit: 12 })
  const items = payload.items || []

  return {
    eyebrow: 'Trazabilidad',
    title: 'Auditoria administrativa',
    description: 'Registro historico de acciones ejecutadas dentro del panel privado.',
    stats: buildStats([
      { label: 'Eventos', value: payload.meta?.total || items.length, caption: 'acciones auditadas' },
      { label: 'Usuarios involucrados', value: new Set(items.map((item) => item.adminUserPublicId).filter(Boolean)).size, caption: 'administradores con actividad reciente' },
      { label: 'Entidades', value: new Set(items.map((item) => item.entityName).filter(Boolean)).size, caption: 'tablas o modulos impactados' },
    ]),
    sections: [
      {
        title: 'Registro reciente',
        subtitle: 'Acciones visibles para control interno y seguimiento operativo.',
        items: items.map((item) => ({
          ...item,
          title: item.actionCode,
          subtitle: `${item.adminUserFullName || 'Sistema'} | ${item.entityName} | ${formatDate(item.createdAt)}`,
          badge: item.entityId ?? 'evento',
        })),
        emptyMessage: 'No hay logs de auditoria.',
      },
    ],
  }
}

const moduleLoaders = {
  projects: loadProjectsModule,
  categories: loadCategoriesModule,
  technologies: loadTechnologiesModule,
  contacts: loadContactsModule,
  users: loadUsersModule,
  roles: loadRolesModule,
  metrics: loadMetricsModule,
  notifications: loadNotificationsModule,
  audit: loadAuditModule,
}

async function loadModule() {
  const key = route.meta.moduleKey || 'projects'
  const loader = moduleLoaders[key]

  if (!loader) {
    errorMessage.value = 'No existe configuracion para este modulo.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    moduleState.value = await loader()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

watch(() => route.meta.moduleKey, loadModule, { immediate: true })
</script>

<template>
  <section class="admin-page">
    <header class="admin-page__header">
      <div>
        <p class="section__eyebrow">{{ moduleState.eyebrow || 'Modulo administrativo' }}</p>
        <h1>{{ moduleState.title || 'Cargando modulo...' }}</h1>
      </div>
      <p>{{ moduleState.description || 'Preparando informacion del modulo seleccionado.' }}</p>
    </header>

    <div v-if="loading" class="empty-state">
      <p>Cargando modulo administrativo...</p>
    </div>

    <div v-else-if="errorMessage" class="empty-state">
      <p>{{ errorMessage }}</p>
    </div>

    <template v-else>
      <section v-if="moduleState.stats?.length" class="admin-stats-grid">
        <StatCard
          v-for="stat in moduleState.stats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :caption="stat.caption"
        />
      </section>

      <section class="admin-grid" :class="{ 'admin-grid--stack': moduleState.sections?.length > 2 }">
        <AdminPanelList
          v-for="section in moduleState.sections"
          :key="section.title"
          :title="section.title"
          :subtitle="section.subtitle"
          :items="section.items"
          :empty-message="section.emptyMessage"
        />
      </section>
    </template>
  </section>
</template>
