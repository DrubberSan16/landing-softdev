<script setup>
import { onMounted, ref } from 'vue'
import LeadFormCard from '../components/LeadFormCard.vue'
import StatCard from '../components/StatCard.vue'
import { usePublicTracking } from '../composables/usePublicTracking'
import { publicApi } from '../services/api'

usePublicTracking()

const loading = ref(true)
const projects = ref([])
const errorMessage = ref('')

const processSteps = [
  {
    title: 'Cuentanos tu necesidad',
    body: 'El formulario captura contexto comercial, proyecto relacionado y metodo de contacto preferido.',
  },
  {
    title: 'Clasificacion automatica',
    body: 'El backend registra el lead, lo asocia al demo y lo deja visible para el equipo interno.',
  },
  {
    title: 'Seguimiento desde el panel',
    body: 'Ventas y administracion pueden cambiar estados, agregar notas y medir conversion por proyecto.',
  },
]

onMounted(async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const payload = await publicApi.getProjects({ page: 1, limit: 50 })
    projects.value = payload.items || []
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="page-stack">
    <section class="page-banner">
      <p class="section__eyebrow">Contacto comercial</p>
      <h1>Lleva una visita de la landing a una oportunidad real de negocio.</h1>
      <p class="lead">
        Este flujo esta pensado para captar solicitudes, asociarlas a proyectos demo cuando aplica
        y habilitar seguimiento interno sin perder contexto.
      </p>
    </section>

    <section class="section">
      <div class="hero__stats hero__stats--three">
        <StatCard label="Canal principal" value="Formulario" caption="entrada centralizada de leads" />
        <StatCard label="Seguimiento" value="Panel admin" caption="asignacion y cambio de estado" />
        <StatCard label="Trazabilidad" value="Por proyecto" caption="conversion vinculada al demo" />
      </div>
    </section>

    <section class="section">
      <div class="split-grid">
        <article class="info-card">
          <p class="section__eyebrow">Como funciona</p>
          <h2>Un flujo simple para el visitante, util para el equipo comercial.</h2>

          <div class="timeline">
            <article v-for="step in processSteps" :key="step.title" class="timeline__item">
              <div class="timeline__dot" />
              <div>
                <h3>{{ step.title }}</h3>
                <p>{{ step.body }}</p>
              </div>
            </article>
          </div>

          <p v-if="errorMessage" class="form-message form-message--error">
            {{ errorMessage }}
          </p>
        </article>

        <LeadFormCard
          :projects="projects"
          :compact="loading"
          title="Solicita demo, cotizacion o reunion"
          description="Comparte tus datos y el backend registrara la solicitud para que el equipo la gestione desde el panel privado."
        />
      </div>
    </section>
  </main>
</template>
