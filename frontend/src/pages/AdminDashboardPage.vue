<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminPanelList from '../components/admin/AdminPanelList.vue'
import StatCard from '../components/StatCard.vue'
import { adminApi } from '../services/api'

const loading = ref(true)
const summary = ref(null)
const errorMessage = ref('')

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
    subtitle: `${item.slug} | ${item.totalDemoClicks || 0} clicks al demo`,
    value: item.totalProjectViews || 0,
    badge: `${item.totalContactRequests || 0} leads`,
  })),
)

const recentLeads = computed(() =>
  (summary.value?.recentLeads || []).map((item) => ({
    ...item,
    title: item.fullName,
    subtitle: `${item.projectTitle || 'Lead general'} | ${item.email}`,
    badge: item.status,
  })),
)

const queueSnapshot = computed(() => {
  const queue = summary.value?.notificationQueue || {}

  return [
    { label: 'Pendientes', value: queue.pending || 0, badge: 'queue' },
    { label: 'Fallidas', value: queue.failed || 0, badge: 'retry' },
    { label: 'Enviadas', value: queue.sent || 0, badge: 'sent' },
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
          title="Proyectos con mayor traccion"
          subtitle="Los demos mas consultados ayudan a priorizar narrativa comercial y mejoras."
          :items="topProjects"
          empty-message="Aun no hay proyectos suficientes para el ranking."
        />

        <AdminPanelList
          title="Leads recientes"
          subtitle="Solicitudes entrantes visibles para clasificacion y seguimiento."
          :items="recentLeads"
          empty-message="Todavia no se han recibido leads desde la landing."
        />
      </section>

      <section class="admin-grid admin-grid--single">
        <AdminPanelList
          title="Estado actual de la cola de notificaciones"
          subtitle="Snapshot rapido para detectar alertas pendientes o eventos fallidos."
          :items="queueSnapshot"
          empty-message="No hay actividad de notificaciones para mostrar."
        />
      </section>
    </template>
  </section>
</template>
