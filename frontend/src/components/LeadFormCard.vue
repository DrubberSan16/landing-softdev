<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { publicApi } from '../services/api'

const props = defineProps({
  title: {
    type: String,
    default: 'Solicita una reunion o cotizacion',
  },
  description: {
    type: String,
    default:
      'Convierte la landing en una herramienta comercial real. Deja tus datos y te contactaremos.',
  },
  projects: {
    type: Array,
    default: () => [],
  },
  initialProjectSlug: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const form = ref({
  fullName: '',
  companyName: '',
  email: '',
  phone: '',
  preferredContactMethod: 'email',
  subject: 'Quiero una demo o una propuesta similar',
  message: '',
  budgetRange: '',
  projectSlug: props.initialProjectSlug,
  termsAccepted: true,
  wantsNotifications: true,
})

const selectProjects = computed(() =>
  props.projects.map((project) => ({
    label: project.title,
    value: project.slug,
  })),
)

async function handleSubmit() {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    await publicApi.createContactRequest({
      ...form.value,
      sourcePath: route.fullPath,
      sourcePageUrl: window.location.href,
    })

    successMessage.value =
      'Tu solicitud ya quedo registrada. El equipo comercial podra verla desde el panel administrativo.'
    form.value = {
      fullName: '',
      companyName: '',
      email: '',
      phone: '',
      preferredContactMethod: 'email',
      subject: 'Quiero una demo o una propuesta similar',
      message: '',
      budgetRange: '',
      projectSlug: props.initialProjectSlug,
      termsAccepted: true,
      wantsNotifications: true,
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="form-card" :class="{ 'form-card--compact': compact }">
    <div class="form-card__header">
      <p class="section__eyebrow">Lead funnel</p>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>

    <form class="lead-form" @submit.prevent="handleSubmit">
      <label>
        <span>Nombre completo</span>
        <input v-model="form.fullName" required maxlength="150" />
      </label>

      <label>
        <span>Empresa</span>
        <input v-model="form.companyName" maxlength="150" />
      </label>

      <label>
        <span>Correo</span>
        <input v-model="form.email" type="email" required />
      </label>

      <label>
        <span>Telefono</span>
        <input v-model="form.phone" maxlength="30" />
      </label>

      <label>
        <span>Metodo preferido</span>
        <select v-model="form.preferredContactMethod">
          <option value="email">Correo</option>
          <option value="phone">Llamada</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </label>

      <label>
        <span>Proyecto relacionado</span>
        <select v-model="form.projectSlug">
          <option value="">Sin proyecto especifico</option>
          <option
            v-for="project in selectProjects"
            :key="project.value"
            :value="project.value"
          >
            {{ project.label }}
          </option>
        </select>
      </label>

      <label class="lead-form__full">
        <span>Asunto</span>
        <input v-model="form.subject" required maxlength="180" />
      </label>

      <label class="lead-form__full">
        <span>Mensaje</span>
        <textarea v-model="form.message" required maxlength="5000" rows="5" />
      </label>

      <label>
        <span>Rango estimado</span>
        <input v-model="form.budgetRange" maxlength="50" placeholder="$5k - $10k" />
      </label>

      <label class="checkbox-field">
        <input v-model="form.termsAccepted" type="checkbox" required />
        <span>Acepto el tratamiento comercial de mis datos.</span>
      </label>

      <label class="checkbox-field">
        <input v-model="form.wantsNotifications" type="checkbox" />
        <span>Deseo recibir seguimiento sobre demos y propuestas.</span>
      </label>

      <div class="lead-form__actions">
        <button class="button button--primary" type="submit" :disabled="loading">
          {{ loading ? 'Enviando...' : 'Enviar solicitud' }}
        </button>
        <p v-if="successMessage" class="form-message form-message--success">{{ successMessage }}</p>
        <p v-if="errorMessage" class="form-message form-message--error">{{ errorMessage }}</p>
      </div>
    </form>
  </section>
</template>
