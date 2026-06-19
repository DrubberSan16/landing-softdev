<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminPanelList from '../components/admin/AdminPanelList.vue'
import StatCard from '../components/StatCard.vue'
import { adminApi } from '../services/api'

const loading = ref(true)
const summary = ref(null)
const errorMessage = ref('')

const statusLabels = {
  new: 'Nuevo',
  in_progress: 'En seguimiento',
  contacted: 'Contactado',
  won: 'Ganado',
  lost: 'Perdido',
  closed: 'Cerrado',
}

function formatDate(value) {
  return value
    ? new Date(value).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
    : 'No registrada'
}

const stats = computed(() => {
  const siteMetrics = summary.value?.siteMetrics || {}
  const queue = summary.value?.notificationQueue || {}

  return [
    {
      label: 'Visitantes unicos',
      value: siteMetrics.totalUniqueVisitorsSite || 0,
      caption: 'alcance acumulado del sitio',
    },
    {
      label: 'Sesiones',
      value: siteMetrics.totalSessionsSite || 0,
      caption: 'actividad registrada en la landing',
    },
    {
      label: 'Vistas',
      value: siteMetrics.totalPageViewsSite || 0,
      caption: 'paginas consultadas por visitantes',
    },
    {
      label: 'Clicks demo',
      value: siteMetrics.totalDemoClicksSite || 0,
      caption: 'interes funcional sobre demos',
    },
    {
      label: 'Leads',
      value: siteMetrics.totalContactRequestsSite || 0,
      caption: 'solicitudes comerciales registradas',
    },
    {
      label: 'Pendientes',
      value: queue.pending || 0,
      caption: 'items en cola de notificacion',
    },
  ]
})

const topProjects = computed(() =>
  (summary.value?.topProjects || []).map((item) => ({
    ...item,
    subtitle: `Identificador web: ${item.slug}`,
    value: item.totalProjectViews || 0,
    badge: `${item.totalContactRequests || 0} leads`,
    details: [
      { label: 'Vistas', value: item.totalProjectViews || 0 },
      { label: 'Clics al demo', value: item.totalDemoClicks || 0 },
      { label: 'Solicitudes', value: item.totalContactRequests || 0 },
    ],
  })),
)

const recentLeads = computed(() =>
  (summary.value?.recentLeads || []).map((item) => ({
    ...item,
    title: item.fullName,
    subtitle: item.subject || 'Solicitud de información',
    badge: statusLabels[item.status] || item.status,
    details: [
      { label: 'Correo', value: item.email, href: item.email ? `mailto:${item.email}` : '' },
      { label: 'Teléfono', value: item.phone || 'No registrado', href: item.phone ? `tel:${item.phone}` : '' },
      { label: 'Proyecto', value: item.projectTitle || 'Consulta general' },
      { label: 'Recibida', value: formatDate(item.createdAt) },
    ],
    bodyLabel: 'Mensaje',
    body: item.message,
  })),
)

const queueSnapshot = computed(() => {
  const queue = summary.value?.notificationQueue || {}

  return [
    { label: 'Pendientes', value: queue.pending || 0, badge: 'Esperan envío', subtitle: 'Notificaciones que aún no han sido procesadas.' },
    { label: 'Fallidas', value: queue.failed || 0, badge: 'Requieren revisión', subtitle: 'Envíos que terminaron con un error.' },
    { label: 'Enviadas', value: queue.sent || 0, badge: 'Completadas', subtitle: 'Notificaciones entregadas correctamente.' },
  ]
})

onMounted(async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    summary.value = await adminApi.getDashboardSummary()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="admin-page">
    <header class="admin-page__header">
      <div>
        <p class="section__eyebrow">Dashboard ejecutivo</p>
        <h1>Resumen operativo del sitio, los demos y el embudo comercial.</h1>
      </div>
      <p>
        Esta vista concentra alcance del sitio, interes por demos, leads recientes y estado de las
        notificaciones.
      </p>
    </header>

    <div v-if="loading" class="empty-state">
      <p>Cargando resumen del dashboard...</p>
    </div>

    <div v-else-if="errorMessage" class="empty-state">
      <p>{{ errorMessage }}</p>
    </div>

    <template v-else>
      <section class="admin-stats-grid">
        <StatCard
          v-for="stat in stats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :caption="stat.caption"
        />
      </section>

      <section class="admin-grid">
        <AdminPanelList
          eyebrow="Portafolio"
          title="Proyectos con mayor traccion"
          subtitle="Los demos mas consultados ayudan a priorizar narrativa comercial y mejoras."
          :items="topProjects"
          empty-message="Aun no hay proyectos suficientes para el ranking."
        />

        <AdminPanelList
          eyebrow="Solicitudes de Contáctenos"
          title="Contactos recientes"
          subtitle="Datos básicos de las personas que enviaron el formulario. El seguimiento completo está en Solicitudes de contacto."
          :items="recentLeads"
          empty-message="Todavia no se han recibido leads desde la landing."
        />
      </section>

      <section class="admin-grid admin-grid--single">
        <AdminPanelList
          eyebrow="Automatizaciones"
          title="Estado actual de la cola de notificaciones"
          subtitle="Snapshot rapido para detectar alertas pendientes o eventos fallidos."
          :items="queueSnapshot"
          empty-message="No hay actividad de notificaciones para mostrar."
        />
      </section>
    </template>
  </section>
</template>
