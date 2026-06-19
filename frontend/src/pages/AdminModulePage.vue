<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminDataTable from '../components/admin/AdminDataTable.vue'
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
const saving = ref(false)
const workingAction = ref(false)
const successMessage = ref('')
const actionErrorMessage = ref('')
const formFeedback = ref('')
const formOptions = ref({
  categories: [],
  technologies: [],
  roles: [],
  permissions: [],
  users: [],
  notificationChannels: [],
})
const formState = ref({
  open: false,
  mode: 'create',
  type: '',
  item: null,
  values: {},
})
const deleteState = ref({
  open: false,
  item: null,
})

const statusOptions = {
  boolean: [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ],
  project: [
    { label: 'Borrador', value: 'draft' },
    { label: 'Publicado', value: 'published' },
    { label: 'Archivado', value: 'archived' },
  ],
  visibility: [
    { label: 'Publico', value: 'public' },
    { label: 'Privado', value: 'private' },
    { label: 'Oculto', value: 'hidden' },
  ],
  user: [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
    { label: 'Bloqueado', value: 'blocked' },
  ],
  contact: [
    { label: 'Nuevo', value: 'new' },
    { label: 'En proceso', value: 'in_progress' },
    { label: 'Contactado', value: 'contacted' },
    { label: 'Ganado', value: 'won' },
    { label: 'Perdido', value: 'lost' },
    { label: 'Cerrado', value: 'closed' },
  ],
  notification: [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Procesando', value: 'processing' },
    { label: 'Enviada', value: 'sent' },
    { label: 'Fallida', value: 'failed' },
    { label: 'Cancelada', value: 'cancelled' },
  ],
}

function formatDate(value) {
  if (!value) {
    return 'sin fecha'
  }

  return new Date(value).toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const readableStatuses = {
  active: 'Activo',
  inactive: 'Inactivo',
  blocked: 'Bloqueado',
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
  public: 'Público',
  private: 'Privado',
  hidden: 'Oculto',
  new: 'Nuevo',
  in_progress: 'En seguimiento',
  contacted: 'Contactado',
  won: 'Ganado',
  lost: 'Perdido',
  closed: 'Cerrado',
  pending: 'Pendiente',
  processing: 'Procesando',
  sent: 'Enviada',
  failed: 'Fallida',
  cancelled: 'Cancelada',
}

function formatStatus(value, fallback = 'Sin estado') {
  return readableStatuses[value] || value || fallback
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-EC')
}

function detail(label, value, options = {}) {
  return {
    label,
    value: value === null || value === undefined || value === '' ? 'No registrado' : value,
    ...options,
  }
}

function yesNo(value) {
  return value ? 'Sí' : 'No'
}

function preferredContactLabel(value) {
  const labels = {
    email: 'Correo electrónico',
    phone: 'Llamada telefónica',
    whatsapp: 'WhatsApp',
  }

  return labels[value] || value || 'No indicado'
}

function buildStats(definitions) {
  return definitions.map((item) => ({
    label: item.label,
    value: item.value,
    caption: item.caption,
  }))
}

function toSlug(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function optionFromName(item) {
  return {
    label: item.name || item.fullName || item.email || item.code,
    value: item.publicId || item.code || item.id,
  }
}

function categoryOptions() {
  return formOptions.value.categories.map(optionFromName)
}

function technologyOptions() {
  return formOptions.value.technologies.map(optionFromName)
}

function roleOptions() {
  return formOptions.value.roles.map((role) => ({
    label: role.name,
    value: role.code,
  }))
}

function permissionOptions() {
  return formOptions.value.permissions.map((permission) => ({
    label: `${permission.moduleName}: ${permission.description || permission.code}`,
    value: permission.code,
  }))
}

function notificationChannelOptions() {
  return formOptions.value.notificationChannels.map((channel) => ({
    label: channel.name,
    value: channel.code,
  }))
}

function userOptions() {
  return formOptions.value.users.map((user) => ({
    label: `${user.fullName} (${user.email})`,
    value: user.publicId,
  }))
}

function withEditMeta(item, type = '') {
  return {
    ...item,
    maintenanceType: type,
    canEdit: item.canEdit ?? true,
  }
}

const maintenanceConfigs = {
  projects: {
    canCreate: true,
    createLabel: 'Crear proyecto',
    createTitle: 'Nuevo proyecto demo',
    editTitle: (item) => `Editar ${item.title}`,
    fields: () => [
      { name: 'title', label: 'Titulo', required: true },
      { name: 'slug', label: 'Slug', required: true, deriveFrom: 'title', transform: toSlug },
      { name: 'shortDescription', label: 'Descripcion corta', type: 'textarea', required: true, full: true },
      { name: 'demoUrl', label: 'URL del demo', type: 'url', required: true },
      { name: 'categoryPublicId', label: 'Categoria', type: 'select', options: categoryOptions, emptyLabel: 'Sin categoria', nullable: true },
      { name: 'technologyPublicIds', label: 'Tecnologias', type: 'select', multiple: true, options: technologyOptions, fromItem: (item) => item.technologies?.map((tech) => tech.publicId) || [] },
      { name: 'status', label: 'Estado', type: 'select', options: () => statusOptions.project, default: 'draft', required: true },
      { name: 'visibility', label: 'Visibilidad', type: 'select', options: () => statusOptions.visibility, default: 'public', required: true },
      { name: 'isFeatured', label: 'Mostrar en landing page', type: 'checkbox', default: false, help: 'Al activarlo, el proyecto aparecerá como una card dinámica en la página principal cuando también esté publicado y sea público.' },
      { name: 'sortOrder', label: 'Orden', type: 'number', default: 0 },
      { name: 'versionLabel', label: 'Version', nullable: true },
      { name: 'clientName', label: 'Cliente', nullable: true },
      { name: 'businessSector', label: 'Sector', nullable: true },
      { name: 'coverImageUrl', label: 'Imagen principal', type: 'url', nullable: true, full: true },
      { name: 'fullDescription', label: 'Descripcion completa', type: 'textarea', nullable: true, full: true },
      { name: 'metaTitle', label: 'Meta titulo', nullable: true },
      { name: 'metaDescription', label: 'Meta descripcion', type: 'textarea', nullable: true, full: true },
    ],
    create: (payload) => adminApi.createProject(payload),
    update: (item, payload) => adminApi.updateProject(item.publicId, payload),
    remove: (item) => adminApi.deleteProject(item.publicId),
    toggle: (item) => adminApi.updateProject(item.publicId, {
      status: item.status === 'archived' ? 'draft' : 'archived',
      isFeatured: item.status === 'archived' ? item.isFeatured : false,
    }),
  },
  categories: {
    canCreate: true,
    createLabel: 'Crear categoria',
    createTitle: 'Nueva categoria',
    editTitle: (item) => `Editar ${item.name}`,
    fields: () => [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'slug', label: 'Slug', required: true, deriveFrom: 'name', transform: toSlug },
      { name: 'description', label: 'Descripcion', type: 'textarea', nullable: true, full: true },
      { name: 'icon', label: 'Icono', nullable: true },
      { name: 'sortOrder', label: 'Orden', type: 'number', default: 0 },
      { name: 'status', label: 'Activa', type: 'checkbox', default: true },
    ],
    create: (payload) => adminApi.createCategory(payload),
    update: (item, payload) => adminApi.updateCategory(item.publicId, payload),
    remove: (item) => adminApi.deleteCategory(item.publicId),
    toggle: (item) => adminApi.updateCategory(item.publicId, { status: !item.status }),
  },
  technologies: {
    canCreate: true,
    createLabel: 'Crear tecnologia',
    createTitle: 'Nueva tecnologia',
    editTitle: (item) => `Editar ${item.name}`,
    fields: () => [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'slug', label: 'Slug', required: true, deriveFrom: 'name', transform: toSlug },
      { name: 'description', label: 'Descripcion', type: 'textarea', nullable: true, full: true },
      { name: 'icon', label: 'Icono', nullable: true },
      { name: 'officialUrl', label: 'URL oficial', type: 'url', nullable: true },
      { name: 'colorHex', label: 'Color', type: 'color', default: '#42B883', nullable: true },
      { name: 'status', label: 'Activa', type: 'checkbox', default: true },
    ],
    create: (payload) => adminApi.createTechnology(payload),
    update: (item, payload) => adminApi.updateTechnology(item.publicId, payload),
    remove: (item) => adminApi.deleteTechnology(item.publicId),
    toggle: (item) => adminApi.updateTechnology(item.publicId, { status: !item.status }),
  },
  contacts: {
    editTitle: (item) => `Actualizar ${item.fullName}`,
    fields: () => [
      { name: 'status', label: 'Estado del seguimiento', type: 'select', options: () => statusOptions.contact, required: true, help: 'Indica en qué etapa comercial se encuentra la solicitud.' },
      { name: 'assignedToPublicId', label: 'Responsable', type: 'select', options: userOptions, emptyLabel: 'Sin responsable', nullable: true, help: 'Persona del equipo encargada de responder y dar seguimiento.' },
      { name: 'firstResponseAt', label: 'Fecha de primera respuesta', type: 'datetime-local', nullable: true },
      { name: 'closedAt', label: 'Fecha de cierre', type: 'datetime-local', nullable: true },
      { name: 'adminNotes', label: 'Notas internas', type: 'textarea', nullable: true, full: true, help: 'Solo son visibles para el equipo administrativo.' },
    ],
    update: (item, payload) => adminApi.updateContact(item.publicId, payload),
    remove: (item) => adminApi.deleteContact(item.publicId),
  },
  users: {
    canCreate: true,
    createLabel: 'Crear usuario',
    createTitle: 'Nuevo usuario administrativo',
    editTitle: (item) => `Editar ${item.fullName}`,
    fields: (mode) => [
      { name: 'firstName', label: 'Nombre', required: true },
      { name: 'lastName', label: 'Apellido', required: true },
      { name: 'email', label: 'Correo', type: 'email', required: true },
      { name: 'phone', label: 'Telefono', nullable: true },
      { name: 'password', label: mode === 'create' ? 'Contrasena' : 'Nueva contrasena', type: 'password', required: mode === 'create', omitWhenEmpty: mode === 'edit' },
      { name: 'status', label: 'Estado', type: 'select', options: () => statusOptions.user, default: 'active', required: true },
      { name: 'roleCodes', label: 'Roles', type: 'select', multiple: true, options: roleOptions, fromItem: (item) => item.roles?.map((role) => role.code) || [] },
      { name: 'mustChangePassword', label: 'Debe cambiar contrasena', type: 'checkbox', default: false },
      { name: 'avatarUrl', label: 'Avatar', type: 'url', nullable: true, full: true },
    ],
    create: (payload) => adminApi.createUser(payload),
    update: (item, payload) => adminApi.updateUser(item.publicId, payload),
    remove: (item) => adminApi.deleteUser(item.publicId),
    toggle: (item) => adminApi.updateUser(item.publicId, {
      status: item.status === 'active' ? 'inactive' : 'active',
    }),
  },
  roles: {
    canCreate: true,
    createLabel: 'Crear rol',
    createTitle: 'Nuevo rol administrativo',
    editTitle: (item) => `Editar ${item.name}`,
    fields: () => [
      { name: 'code', label: 'Código', required: true },
      { name: 'name', label: 'Nombre', required: true },
      { name: 'description', label: 'Descripción', type: 'textarea', nullable: true, full: true },
      { name: 'permissionCodes', label: 'Permisos', type: 'select', multiple: true, options: permissionOptions, fromItem: (item) => item.permissions?.map((permission) => permission.code) || [] },
      { name: 'status', label: 'Rol activo', type: 'checkbox', default: true },
    ],
    create: (payload) => adminApi.createRole(payload),
    update: (item, payload) => adminApi.updateRole(item.code, payload),
    remove: (item) => adminApi.deleteRole(item.code),
    toggle: (item) => adminApi.updateRole(item.code, { status: !item.status }),
  },
  notifications: {
    types: {
      channel: {
        canCreate: true,
        createTitle: 'Nuevo canal de notificación',
        editTitle: (item) => `Editar canal ${item.name}`,
        fields: () => [
          { name: 'code', label: 'Código', required: true },
          { name: 'name', label: 'Nombre', required: true },
          { name: 'description', label: 'Descripción', type: 'textarea', nullable: true, full: true },
          { name: 'isActive', label: 'Canal activo', type: 'checkbox', default: true },
        ],
        create: (payload) => adminApi.createNotificationChannel(payload),
        update: (item, payload) => adminApi.updateNotificationChannel(item.id, payload),
        remove: (item) => adminApi.deleteNotificationChannel(item.id),
        toggle: (item) => adminApi.updateNotificationChannel(item.id, { isActive: !item.isActive }),
      },
      template: {
        canCreate: true,
        createTitle: 'Nueva plantilla de notificación',
        editTitle: (item) => `Editar plantilla ${item.name}`,
        fields: () => [
          { name: 'eventCode', label: 'Código del evento', required: true },
          { name: 'channelCode', label: 'Canal', type: 'select', options: notificationChannelOptions, required: true },
          { name: 'name', label: 'Nombre', required: true },
          { name: 'subjectTemplate', label: 'Plantilla del asunto', nullable: true, full: true },
          { name: 'bodyTemplate', label: 'Plantilla del mensaje', type: 'textarea', required: true, full: true },
          { name: 'isActive', label: 'Plantilla activa', type: 'checkbox', default: true },
        ],
        create: (payload) => adminApi.createNotificationTemplate(payload),
        update: (item, payload) => adminApi.updateNotificationTemplate(item.id, payload),
        remove: (item) => adminApi.deleteNotificationTemplate(item.id),
        toggle: (item) => adminApi.updateNotificationTemplate(item.id, { isActive: !item.isActive }),
      },
      queue: {
        editTitle: (item) => `Actualizar ${item.eventCode}`,
        fields: () => [
          { name: 'status', label: 'Estado', type: 'select', options: () => statusOptions.notification, required: true },
          { name: 'errorMessage', label: 'Mensaje de error', type: 'textarea', nullable: true, full: true },
        ],
        update: (item, payload) => adminApi.updateNotificationQueue(item.id, payload),
      },
      preference: {
        editTitle: (item) => `Preferencia ${item.eventCode}`,
        fields: () => [
          { name: 'isEnabled', label: 'Habilitada', type: 'checkbox', default: true },
        ],
        update: (item, payload) => adminApi.updateNotificationPreference(item.id, payload),
        toggle: (item) => adminApi.updateNotificationPreference(item.id, { isEnabled: !item.isEnabled }),
      },
    },
  },
}

const currentMaintenanceConfig = computed(() => getMaintenanceConfig())
const activeMaintenanceConfig = computed(() => getMaintenanceConfig(formState.value.type))
const activeFields = computed(() => activeMaintenanceConfig.value?.fields?.(formState.value.mode) || [])
const formTitle = computed(() => {
  const config = activeMaintenanceConfig.value

  if (!config) {
    return ''
  }

  if (formState.value.mode === 'create') {
    return config.createTitle || 'Nuevo registro'
  }

  return config.editTitle?.(formState.value.item) || 'Editar registro'
})
const submitLabel = computed(() =>
  formState.value.mode === 'create' ? 'Crear registro' : 'Guardar cambios',
)

function getMaintenanceConfig(type = '') {
  const config = maintenanceConfigs[route.meta.moduleKey || 'projects']

  if (!config) {
    return null
  }

  if (config.types) {
    return type ? config.types[type] : null
  }

  return config
}

function fieldOptions(field) {
  return typeof field.options === 'function' ? field.options() : field.options || []
}

function isFieldRequired(field) {
  return !!field.required
}

function initialFieldValue(field, item, mode) {
  if (mode === 'edit') {
    const value = field.fromItem ? field.fromItem(item) : item?.[field.name]

    if (field.type === 'datetime-local') {
      return toDateTimeLocal(value)
    }

    if (field.multiple) {
      return Array.isArray(value) ? value : []
    }

    if (field.type === 'checkbox') {
      return Boolean(value)
    }

    if (field.type === 'color') {
      return value || field.default || '#000000'
    }

    return value ?? ''
  }

  if (field.multiple) {
    return field.default ?? []
  }

  if (field.type === 'checkbox') {
    return field.default ?? false
  }

  return field.default ?? ''
}

function buildInitialValues(config, item, mode) {
  return config.fields(mode).reduce((values, field) => {
    values[field.name] = initialFieldValue(field, item, mode)
    return values
  }, {})
}

function normalizePayloadValue(value, field) {
  if (field.type === 'checkbox') {
    return Boolean(value)
  }

  if (field.multiple) {
    return Array.isArray(value) ? value : []
  }

  if (field.type === 'number') {
    if (value === '' || value === null || value === undefined) {
      return field.nullable ? null : undefined
    }

    return Number(value)
  }

  if (field.type === 'datetime-local') {
    return value ? new Date(value).toISOString() : field.nullable ? null : undefined
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) {
      if (field.omitWhenEmpty) {
        return undefined
      }

      return field.nullable ? null : ''
    }

    return trimmed
  }

  return value
}

function buildPayload(config) {
  return config.fields(formState.value.mode).reduce((payload, field) => {
    const value = normalizePayloadValue(formState.value.values[field.name], field)

    if (value !== undefined) {
      payload[field.name] = value
    }

    return payload
  }, {})
}

function syncDerivedField(field) {
  const sourceValue = formState.value.values[field.deriveFrom]
  const currentValue = formState.value.values[field.name]

  if (!field.deriveFrom || !field.transform || currentValue) {
    return
  }

  formState.value.values[field.name] = field.transform(sourceValue || '')
}

function updateDerivedFields(sourceName) {
  activeFields.value
    .filter((field) => field.deriveFrom === sourceName)
    .forEach(syncDerivedField)
}

function updateSelectField(field, event) {
  if (field.multiple) {
    formState.value.values[field.name] = Array.from(event.target.selectedOptions).map(
      (option) => option._value ?? option.value,
    )
    return
  }

  const selectedOption = event.target.selectedOptions?.[0]
  formState.value.values[field.name] = selectedOption?._value ?? event.target.value
}

async function openCreateForm(type = '') {
  const config = getMaintenanceConfig(type)

  if (!config?.canCreate) {
    return
  }

  successMessage.value = ''
  actionErrorMessage.value = ''
  formFeedback.value = ''
  formState.value = {
    open: true,
    mode: 'create',
    type,
    item: null,
    values: buildInitialValues(config, null, 'create'),
  }
}

async function openEditForm(item) {
  const config = getMaintenanceConfig(item.maintenanceType || '')

  if (!config?.update) {
    return
  }

  successMessage.value = ''
  actionErrorMessage.value = ''
  formFeedback.value = ''
  formState.value = {
    open: true,
    mode: 'edit',
    type: item.maintenanceType || '',
    item,
    values: buildInitialValues(config, item, 'edit'),
  }
}

function closeForm() {
  formState.value.open = false
  formFeedback.value = ''
}

async function submitMaintenance() {
  const config = activeMaintenanceConfig.value

  if (!config) {
    return
  }

  saving.value = true
  formFeedback.value = ''
  successMessage.value = ''

  try {
    activeFields.value.forEach(syncDerivedField)
    const payload = buildPayload(config)

    if (formState.value.mode === 'create') {
      await config.create(payload)
    } else {
      await config.update(formState.value.item, payload)
    }

    formState.value.open = false
    successMessage.value = 'Registro guardado correctamente.'
    await loadModule()
  } catch (error) {
    formFeedback.value = error.message
  } finally {
    saving.value = false
  }
}

function requestRemove(item) {
  const config = getMaintenanceConfig(item.maintenanceType || '')

  if (!config?.remove) {
    return
  }

  actionErrorMessage.value = ''
  deleteState.value = { open: true, item }
}

function closeDeleteModal() {
  if (workingAction.value) {
    return
  }

  deleteState.value = { open: false, item: null }
}

async function confirmRemove() {
  const item = deleteState.value.item
  const config = item ? getMaintenanceConfig(item.maintenanceType || '') : null

  if (!item || !config?.remove) {
    return
  }

  workingAction.value = true
  successMessage.value = ''
  actionErrorMessage.value = ''

  try {
    await config.remove(item)
    deleteState.value = { open: false, item: null }
    successMessage.value = 'Registro eliminado correctamente.'
    await loadModule()
  } catch (error) {
    actionErrorMessage.value = error.message
  } finally {
    workingAction.value = false
  }
}

function handleModalKeydown(event) {
  if (event.key !== 'Escape') {
    return
  }

  if (deleteState.value.open) {
    closeDeleteModal()
  } else if (formState.value.open && !saving.value) {
    closeForm()
  }
}

watch(
  [() => formState.value.open, () => deleteState.value.open],
  ([formOpen, deleteOpen]) => {
    document.body.classList.toggle('modal-open', formOpen || deleteOpen)
  },
)

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleModalKeydown)
}

onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
  window.removeEventListener('keydown', handleModalKeydown)
})

async function toggleItem(item) {
  const config = getMaintenanceConfig(item.maintenanceType || '')

  if (!config?.toggle) {
    return
  }

  workingAction.value = true
  successMessage.value = ''
  actionErrorMessage.value = ''

  try {
    await config.toggle(item)
    successMessage.value = 'Estado actualizado correctamente.'
    await loadModule()
  } catch (error) {
    actionErrorMessage.value = error.message
  } finally {
    workingAction.value = false
  }
}

async function loadProjectsModule() {
  const [payload, categories, technologies] = await Promise.all([
    adminApi.getProjects({ page: 1, limit: 100 }),
    adminApi.getCategories(),
    adminApi.getTechnologies(),
  ])
  const items = payload.items || []
  formOptions.value.categories = categories
  formOptions.value.technologies = technologies

  return {
    eyebrow: 'Gestion editorial',
    title: 'Proyectos demo',
    description: 'Administra los proyectos que aparecen en el portafolio público. Revisa su visibilidad, contenido y rendimiento antes de publicarlos.',
    stats: buildStats([
      { label: 'Total listado', value: payload.meta?.total || items.length, caption: 'proyectos registrados' },
      { label: 'Publicados visibles', value: items.filter((item) => item.status === 'published').length, caption: 'entre los proyectos recientes' },
      { label: 'Destacados visibles', value: items.filter((item) => item.isFeatured).length, caption: 'entre los proyectos recientes' },
    ]),
    sections: [
      {
        eyebrow: 'Portafolio',
        title: 'Proyectos',
        subtitle: 'Cada fila resume cómo se publica el proyecto y el interés que ha generado.',
        editable: true,
        deletable: true,
        toggleable: true,
        columns: [
          { label: 'Proyecto', key: 'title', secondaryKey: 'shortDescription', wide: true },
          { label: 'URL', key: 'demoUrl', href: (item) => item.demoUrl, external: true, truncate: true },
          { label: 'Categoría', key: 'categoryName', empty: 'Sin categoría' },
          { label: 'Estado', value: (item) => formatStatus(item.status), secondary: (item) => formatStatus(item.visibility), type: 'status' },
          { label: 'En landing', value: (item) => yesNo(item.isFeatured) },
          { label: 'Rendimiento', value: (item) => `${formatNumber(item.totalProjectViews)} vistas`, secondary: (item) => `${formatNumber(item.totalDemoClicks)} clics` },
        ],
        items: items.map((item) => withEditMeta({
          ...item,
          subtitle: item.shortDescription,
          badge: formatStatus(item.status),
          details: [
            detail('Categoría', item.categoryName),
            detail('Visibilidad', formatStatus(item.visibility)),
            detail('Tecnologías', item.technologies?.map((technology) => technology.name).join(', ')),
            detail('Versión', item.versionLabel),
            detail('Vistas', formatNumber(item.totalProjectViews)),
            detail('Clics al demo', formatNumber(item.totalDemoClicks)),
          ],
          note: item.isFeatured ? 'Este proyecto está destacado en la landing.' : '',
          canDelete: true,
          canToggle: true,
          toggleLabel: item.status === 'archived' ? 'Reactivar' : 'Desactivar',
        })),
        emptyMessage: 'Aun no existen proyectos cargados.',
      },
    ],
  }
}

async function loadCategoriesModule() {
  const items = await adminApi.getCategories()
  formOptions.value.categories = items

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
        eyebrow: 'Organización del portafolio',
        title: 'Listado actual',
        subtitle: 'Las categorías ayudan a los visitantes a entender y explorar el tipo de solución ofrecida.',
        editable: true,
        deletable: true,
        toggleable: true,
        columns: [
          { label: 'Categoría', key: 'name', secondaryKey: 'slug' },
          { label: 'Descripción', key: 'description', truncate: true, wide: true },
          { label: 'Orden', key: 'sortOrder' },
          { label: 'Estado', value: (item) => item.status ? 'Activa' : 'Inactiva', type: 'status' },
          { label: 'Actualizada', value: (item) => formatDate(item.updatedAt) },
        ],
        items: items.map((item) => withEditMeta({
          ...item,
          title: item.name,
          subtitle: item.description || 'Esta categoría todavía no tiene una descripción.',
          badge: item.status ? 'Activa' : 'Inactiva',
          details: [detail('Identificador web', item.slug), detail('Orden de aparición', item.sortOrder ?? 0)],
          canDelete: true,
          canToggle: true,
          toggleLabel: item.status ? 'Desactivar' : 'Activar',
        })),
        emptyMessage: 'No hay categorias creadas.',
      },
    ],
  }
}

async function loadTechnologiesModule() {
  const items = await adminApi.getTechnologies()
  formOptions.value.technologies = items

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
        eyebrow: 'Stack tecnológico',
        title: 'Stack administrado',
        subtitle: 'Tecnologías que se pueden asociar a los proyectos del portafolio.',
        editable: true,
        deletable: true,
        toggleable: true,
        columns: [
          { label: 'Tecnología', key: 'name', secondaryKey: 'slug' },
          { label: 'Descripción', key: 'description', truncate: true, wide: true },
          { label: 'Sitio oficial', key: 'officialUrl', href: (item) => item.officialUrl, external: true, truncate: true },
          { label: 'Color', key: 'colorHex' },
          { label: 'Estado', value: (item) => item.status ? 'Activa' : 'Inactiva', type: 'status' },
        ],
        items: items.map((item) => withEditMeta({
          ...item,
          title: item.name,
          subtitle: item.description || 'Esta tecnología todavía no tiene una descripción.',
          badge: item.status ? 'Activa' : 'Inactiva',
          details: [
            detail('Identificador web', item.slug),
            detail('Color', item.colorHex),
            detail('Sitio oficial', item.officialUrl, { href: item.officialUrl, external: true }),
          ],
          canDelete: true,
          canToggle: true,
          toggleLabel: item.status ? 'Desactivar' : 'Activar',
        })),
        emptyMessage: 'No hay tecnologias creadas.',
      },
    ],
  }
}

async function loadContactsModule() {
  const [payload, usersPayload] = await Promise.all([
    adminApi.getContacts({ page: 1, limit: 100 }),
    adminApi.getUsers({ page: 1, limit: 100 }),
  ])
  const items = payload.items || []
  formOptions.value.users = usersPayload.items || []

  return {
    eyebrow: 'Embudo comercial',
    title: 'Solicitudes de contacto',
    description: 'Aquí llegan los formularios enviados desde “Contáctenos”. Revisa los datos de la persona, su necesidad y el canal preferido antes de asignar el seguimiento.',
    stats: buildStats([
      { label: 'Total solicitudes', value: payload.meta?.total || items.length, caption: 'formularios recibidos' },
      { label: 'Nuevos visibles', value: items.filter((item) => item.status === 'new').length, caption: 'entre las solicitudes recientes' },
      { label: 'Asignados visibles', value: items.filter((item) => item.assignedToPublicId).length, caption: 'entre las solicitudes recientes' },
    ]),
    sections: [
      {
        eyebrow: 'Bandeja comercial',
        title: 'Solicitudes recibidas',
        subtitle: 'Ordenadas desde la más reciente. Usa “Gestionar solicitud” para asignar responsable, estado y notas internas.',
        editable: true,
        deletable: true,
        actionLabel: 'Gestionar solicitud',
        columns: [
          { label: 'Persona', key: 'fullName', secondary: (item) => item.companyName || 'Sin empresa' },
          { label: 'Contacto', key: 'email', href: (item) => item.email ? `mailto:${item.email}` : '', secondaryKey: 'phone' },
          { label: 'Solicitud', key: 'subject', secondaryKey: 'message', truncate: true, wide: true },
          { label: 'Proyecto', value: (item) => item.projectTitle || 'Consulta general', secondary: (item) => preferredContactLabel(item.preferredContactMethod) },
          { label: 'Seguimiento', value: (item) => formatStatus(item.status), secondary: (item) => item.assignedToFullName || 'Sin asignar', type: 'status' },
          { label: 'Recibida', value: (item) => formatDate(item.createdAt) },
        ],
        items: items.map((item) => withEditMeta({
          ...item,
          title: item.fullName,
          subtitle: item.subject || 'Solicitud general de información',
          badge: formatStatus(item.status),
          details: [
            detail('Empresa', item.companyName),
            detail('Correo', item.email, { href: item.email ? `mailto:${item.email}` : '' }),
            detail('Teléfono', item.phone, { href: item.phone ? `tel:${item.phone}` : '' }),
            detail('Prefiere contacto por', preferredContactLabel(item.preferredContactMethod)),
            detail('Proyecto de interés', item.projectTitle || 'Consulta general'),
            detail('Presupuesto', item.budgetRange),
            detail('Recibida', formatDate(item.createdAt)),
            detail('Responsable', item.assignedToFullName || 'Sin asignar'),
            detail('Primera respuesta', item.firstResponseAt ? formatDate(item.firstResponseAt) : 'Pendiente'),
            detail('Fecha de cierre', item.closedAt ? formatDate(item.closedAt) : 'Solicitud abierta'),
            detail('Origen', item.sourcePath || item.sourcePageUrl || 'Formulario de Contáctenos'),
            detail('Aceptó recibir novedades', yesNo(item.wantsNotifications)),
          ],
          bodyLabel: 'Mensaje de la persona',
          body: item.message || 'La persona no incluyó un mensaje.',
          note: item.adminNotes ? `Nota interna: ${item.adminNotes}` : 'Sin notas internas todavía.',
          canDelete: true,
        })),
        emptyMessage: 'Todavia no se reciben solicitudes.',
      },
    ],
  }
}

async function loadUsersModule() {
  const [payload, roles] = await Promise.all([
    adminApi.getUsers({ page: 1, limit: 100 }),
    adminApi.getRoles(),
  ])
  const items = payload.items || []
  formOptions.value.roles = roles

  return {
    eyebrow: 'Control de acceso',
    title: 'Usuarios administrativos',
    description: 'Equipo interno con acceso al panel, roles asignados y politicas de sesion.',
    stats: buildStats([
      { label: 'Usuarios', value: payload.meta?.total || items.length, caption: 'cuentas administrativas' },
      { label: 'Activos visibles', value: items.filter((item) => item.status === 'active').length, caption: 'entre los usuarios recientes' },
      { label: 'Roles', value: roles.length, caption: 'perfiles disponibles en el sistema' },
    ]),
    sections: [
      {
        eyebrow: 'Acceso al panel',
        title: 'Usuarios administrativos',
        subtitle: 'Personas que pueden iniciar sesión en este panel y permisos asociados a su cuenta.',
        editable: true,
        deletable: true,
        toggleable: true,
        columns: [
          { label: 'Usuario', key: 'fullName', secondaryKey: 'email' },
          { label: 'Teléfono', key: 'phone' },
          { label: 'Roles', value: (item) => item.roles?.map((role) => role.name).join(', ') || 'Sin roles', wide: true },
          { label: 'Estado', value: (item) => formatStatus(item.status), type: 'status' },
          { label: 'Último acceso', value: (item) => item.lastLoginAt ? formatDate(item.lastLoginAt) : 'Nunca' },
        ],
        items: items.map((item) => withEditMeta({
          ...item,
          subtitle: item.email,
          badge: formatStatus(item.status),
          details: [
            detail('Teléfono', item.phone),
            detail('Roles', item.roles?.map((role) => role.name).join(', ')),
            detail('Último acceso', item.lastLoginAt ? formatDate(item.lastLoginAt) : 'Nunca ha ingresado'),
            detail('Cambio de contraseña pendiente', yesNo(item.mustChangePassword)),
          ],
          canDelete: true,
          canToggle: true,
          toggleLabel: item.status === 'active' ? 'Desactivar' : 'Activar',
        })),
        emptyMessage: 'No hay usuarios administrativos registrados.',
      },
      {
        eyebrow: 'Perfiles de acceso',
        title: 'Roles disponibles',
        subtitle: 'Perfiles que pueden asignarse a los usuarios.',
        columns: [
          { label: 'Rol', key: 'name', secondaryKey: 'code' },
          { label: 'Descripción', key: 'description', wide: true },
          { label: 'Permisos', value: (item) => item.permissions?.length || 0 },
          { label: 'Tipo', value: (item) => item.isSystem ? 'Sistema' : 'Personalizado', type: 'status' },
        ],
        items: roles.map((item) => ({
          ...item,
          title: item.name,
          subtitle: item.description || item.code,
          badge: `${item.permissions?.length || 0} permisos`,
          details: [detail('Código interno', item.code)],
        })),
        emptyMessage: 'No hay roles configurados.',
      },
    ],
  }
}

async function loadRolesModule() {
  const [roles, permissions] = await Promise.all([adminApi.getRoles(), adminApi.getPermissions()])
  formOptions.value.roles = roles
  formOptions.value.permissions = permissions

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
        eyebrow: 'Perfiles de acceso',
        title: 'Roles registrados',
        subtitle: 'Cada rol agrega una combinacion de permisos operativos.',
        editable: true,
        deletable: true,
        toggleable: true,
        columns: [
          { label: 'Rol', key: 'name', secondaryKey: 'code' },
          { label: 'Descripción', key: 'description', wide: true },
          { label: 'Permisos', value: (item) => item.permissions?.length || 0 },
          { label: 'Tipo', value: (item) => item.isSystem ? 'Sistema' : 'Personalizado', type: 'status' },
          { label: 'Estado', value: (item) => item.status ? 'Activo' : 'Inactivo', type: 'status' },
        ],
        items: roles.map((item) => withEditMeta({
          ...item,
          title: item.name,
          subtitle: item.description || item.code,
          badge: `${item.permissions?.length || 0} permisos`,
          details: [
            detail('Código interno', item.code),
            detail('Rol protegido del sistema', yesNo(item.isSystem)),
            detail('Permisos incluidos', item.permissions?.map((permission) => permission.code).join(', ')),
          ],
          canEdit: !item.isSystem,
          canDelete: !item.isSystem,
          canToggle: !item.isSystem,
          toggleLabel: item.status ? 'Desactivar' : 'Activar',
        })),
        emptyMessage: 'No hay roles disponibles.',
      },
      {
        eyebrow: 'Acciones autorizadas',
        title: 'Catalogo de permisos',
        subtitle: 'Permisos utilizables para construir reglas de acceso.',
        columns: [
          { label: 'Código', key: 'code' },
          { label: 'Descripción', key: 'description', wide: true },
          { label: 'Módulo', key: 'moduleName' },
          { label: 'Acción', key: 'actionName', type: 'status' },
        ],
        items: permissions.map((item) => ({
          ...item,
          title: item.code,
          subtitle: item.description || 'Permiso operativo del panel.',
          badge: item.actionName || 'Acción',
          details: [detail('Módulo', item.moduleName), detail('Código interno', item.code)],
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
    description: 'Entiende qué proyectos atraen visitas, clics y solicitudes. La conversión indica qué porcentaje de las vistas termina en un contacto.',
    stats: buildStats([
      { label: 'Visitantes unicos', value: siteMetrics.totalUniqueVisitorsSite || 0, caption: 'alcance total del sitio' },
      { label: 'Proyectos publicados', value: siteMetrics.publishedProjects || 0, caption: 'catalogo visible' },
      { label: 'Clicks demo', value: siteMetrics.totalDemoClicksSite || 0, caption: 'accion hacia demos' },
    ]),
    sections: [
      {
        eyebrow: 'Rendimiento comercial',
        title: 'Metricas por proyecto',
        subtitle: 'Compara el recorrido desde la visita al proyecto hasta la solicitud de contacto.',
        columns: [
          { label: 'Proyecto', key: 'title', secondaryKey: 'slug' },
          { label: 'Vistas', value: (item) => formatNumber(item.totalProjectViews) },
          { label: 'Visitantes únicos', value: (item) => formatNumber(item.totalUniqueVisitors) },
          { label: 'Clics al demo', value: (item) => formatNumber(item.totalDemoClicks) },
          { label: 'Solicitudes', value: (item) => formatNumber(item.totalContactRequests) },
          { label: 'Conversión', value: (item) => `${item.conversionRate || 0}%`, type: 'status' },
        ],
        items: projectMetrics.map((item) => ({
          ...item,
          title: item.title,
          subtitle: `Identificador web: ${item.slug}`,
          badge: `${item.conversionRate || 0}% conversión`,
          details: [
            detail('Vistas del proyecto', formatNumber(item.totalProjectViews)),
            detail('Visitantes únicos', formatNumber(item.totalUniqueVisitors)),
            detail('Clics al demo', formatNumber(item.totalDemoClicks)),
            detail('Solicitudes recibidas', formatNumber(item.totalContactRequests)),
          ],
        })),
        emptyMessage: 'No hay metricas por proyecto aun.',
      },
      {
        eyebrow: 'Interés en demos',
        title: 'Top de clicks al demo',
        subtitle: 'Demos con mayor intencion de exploracion funcional.',
        columns: [
          { label: 'Proyecto', key: 'title', secondaryKey: 'slug', wide: true },
          { label: 'Clics al demo', value: (item) => formatNumber(item.totalClicks), type: 'status' },
        ],
        items: topDemoClicks.map((item) => ({
          ...item,
          title: item.title,
          subtitle: `Identificador web: ${item.slug}`,
          badge: `${formatNumber(item.totalClicks)} clics`,
          details: [detail('Interpretación', 'Veces que los visitantes intentaron abrir el demo')],
        })),
        emptyMessage: 'No hay clicks registrados.',
      },
    ],
  }
}

async function loadNotificationsModule() {
  const [queuePayload, channels, templates, preferences] = await Promise.all([
    adminApi.getNotificationQueue({ page: 1, limit: 100 }),
    adminApi.getNotificationChannels(),
    adminApi.getNotificationTemplates(),
    adminApi.getNotificationPreferences(),
  ])
  const queue = queuePayload.items || []
  formOptions.value.notificationChannels = channels

  return {
    eyebrow: 'Alertas y seguimiento',
    title: 'Notificaciones',
    description: 'Supervisa los mensajes automáticos del sistema: qué se intentó enviar, por qué canal, a quién y si ocurrió algún error.',
    stats: buildStats([
      { label: 'En cola', value: queuePayload.meta?.total || queue.length, caption: 'items recientes de notificacion' },
      { label: 'Canales', value: channels.length, caption: 'mecanismos configurados' },
      { label: 'Plantillas', value: templates.length, caption: 'mensajes automaticos disponibles' },
    ]),
    sections: [
      {
        eyebrow: 'Envíos automáticos',
        title: 'Cola reciente',
        subtitle: 'Los eventos pendientes aún no se envían; los fallidos requieren revisar el detalle del error.',
        editable: true,
        actionLabel: 'Revisar envío',
        columns: [
          { label: 'Evento', key: 'eventCode', secondary: (item) => item.templateName || 'Sin plantilla' },
          { label: 'Destinatario', value: (item) => item.recipientName || item.recipientTo, secondaryKey: 'recipientTo' },
          { label: 'Canal', key: 'channelName' },
          { label: 'Estado', value: (item) => formatStatus(item.status), secondary: (item) => item.errorMessage || '', type: 'status' },
          { label: 'Intentos', value: (item) => `${item.attempts || 0} de ${item.maxAttempts || 0}` },
          { label: 'Creada', value: (item) => formatDate(item.createdAt) },
        ],
        items: queue.map((item) => withEditMeta({
          ...item,
          title: item.subjectOverride || item.templateName || item.eventCode,
          subtitle: `Evento: ${item.eventCode}`,
          badge: formatStatus(item.status),
          details: [
            detail('Canal', item.channelName),
            detail('Destinatario', item.recipientName || item.recipientTo),
            detail('Dirección', item.recipientTo),
            detail('Creada', formatDate(item.createdAt)),
            detail('Intentos', `${item.attempts || 0} de ${item.maxAttempts || 0}`),
            detail('Proyecto relacionado', item.projectTitle),
          ],
          bodyLabel: 'Error del envío',
          body: item.errorMessage,
        }, 'queue')),
        emptyMessage: 'No hay items en cola.',
      },
      {
        eyebrow: 'Configuración de entrega',
        title: 'Canales',
        subtitle: 'Medios disponibles para enviar notificaciones automáticas.',
        maintenanceType: 'channel',
        createLabel: 'Crear canal',
        editable: true,
        deletable: true,
        toggleable: true,
        columns: [
          { label: 'Canal', key: 'name', secondaryKey: 'code' },
          { label: 'Descripción', key: 'description', wide: true },
          { label: 'Estado', value: (item) => item.isActive ? 'Activo' : 'Inactivo', type: 'status' },
        ],
        items: channels.map((item) => withEditMeta({
          ...item,
          title: item.name,
          canDelete: true,
          canToggle: true,
          toggleLabel: item.isActive ? 'Desactivar' : 'Activar',
        }, 'channel')),
        emptyMessage: 'No hay canales configurados.',
      },
      {
        eyebrow: 'Mensajes automáticos',
        title: 'Plantillas',
        subtitle: 'Contenido utilizado para cada evento y canal.',
        maintenanceType: 'template',
        createLabel: 'Crear plantilla',
        editable: true,
        deletable: true,
        toggleable: true,
        columns: [
          { label: 'Plantilla', key: 'name', secondaryKey: 'eventCode' },
          { label: 'Canal', key: 'channelName' },
          { label: 'Asunto', key: 'subjectTemplate', wide: true, truncate: true },
          { label: 'Estado', value: (item) => item.isActive ? 'Activa' : 'Inactiva', type: 'status' },
        ],
        items: templates.map((item) => withEditMeta({
          ...item,
          title: item.name,
          canDelete: true,
          canToggle: true,
          toggleLabel: item.isActive ? 'Desactivar' : 'Activar',
        }, 'template')),
        emptyMessage: 'No hay plantillas configuradas.',
      },
      {
        eyebrow: 'Preferencias personales',
        title: 'Preferencias administrativas',
        subtitle: 'Configuracion por usuario y canal para eventos del sistema.',
        editable: true,
        toggleable: true,
        actionLabel: 'Cambiar preferencia',
        columns: [
          { label: 'Administrador', key: 'adminUserFullName' },
          { label: 'Evento', key: 'eventCode', wide: true },
          { label: 'Canal', key: 'channelName' },
          { label: 'Estado', value: (item) => item.isEnabled ? 'Habilitada' : 'Deshabilitada', type: 'status' },
        ],
        items: preferences.map((item) => withEditMeta({
          ...item,
          title: item.adminUserFullName,
          subtitle: `Evento: ${item.eventCode}`,
          badge: item.isEnabled ? 'Habilitada' : 'Deshabilitada',
          details: [detail('Canal', item.channelName)],
          canToggle: true,
          toggleLabel: item.isEnabled ? 'Desactivar' : 'Activar',
        }, 'preference')),
        emptyMessage: 'No hay preferencias definidas.',
      },
    ],
  }
}

async function loadAuditModule() {
  const payload = await adminApi.getAuditLogs({ page: 1, limit: 100 })
  const items = payload.items || []

  return {
    eyebrow: 'Trazabilidad',
    title: 'Auditoria administrativa',
    description: 'Consulta quién hizo un cambio, sobre qué parte del sistema y cuándo ocurrió. Este historial es de solo lectura.',
    stats: buildStats([
      { label: 'Eventos', value: payload.meta?.total || items.length, caption: 'acciones auditadas' },
      { label: 'Usuarios recientes', value: new Set(items.map((item) => item.adminUserPublicId).filter(Boolean)).size, caption: 'en los eventos mostrados' },
      { label: 'Módulos recientes', value: new Set(items.map((item) => item.entityName).filter(Boolean)).size, caption: 'en los eventos mostrados' },
    ]),
    sections: [
      {
        eyebrow: 'Historial de cambios',
        title: 'Registro reciente',
        subtitle: 'Las acciones más recientes aparecen primero y permiten rastrear cambios administrativos.',
        columns: [
          { label: 'Acción', key: 'description', secondaryKey: 'actionCode', wide: true },
          { label: 'Usuario', value: (item) => item.adminUserFullName || 'Sistema', secondaryKey: 'adminUserEmail' },
          { label: 'Entidad', key: 'entityName', secondary: (item) => item.entityId ? `Registro ${item.entityId}` : '' },
          { label: 'IP', key: 'ipAddress' },
          { label: 'Fecha', value: (item) => formatDate(item.createdAt) },
        ],
        items: items.map((item) => ({
          ...item,
          title: item.description || item.actionCode,
          subtitle: `Acción: ${item.actionCode}`,
          badge: item.adminUserFullName || 'Sistema',
          details: [
            detail('Fecha', formatDate(item.createdAt)),
            detail('Módulo o entidad', item.entityName),
            detail('Registro afectado', item.entityId),
            detail('Correo del usuario', item.adminUserEmail),
            detail('Dirección IP', item.ipAddress),
          ],
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
  actionErrorMessage.value = ''

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
      <div class="admin-page__summary">
        <p>{{ moduleState.description || 'Preparando informacion del modulo seleccionado.' }}</p>
        <button
          v-if="currentMaintenanceConfig?.canCreate"
          class="button button--primary"
          type="button"
          @click="openCreateForm()"
        >
          {{ currentMaintenanceConfig.createLabel || 'Crear registro' }}
        </button>
      </div>
    </header>

    <p v-if="successMessage" class="form-message form-message--success">{{ successMessage }}</p>
    <p v-if="actionErrorMessage" class="form-message form-message--error">{{ actionErrorMessage }}</p>

    <Teleport to="body">
      <div
        v-if="formState.open"
        class="admin-modal-backdrop"
        @mousedown.self="!saving && closeForm()"
      >
        <section
          class="admin-panel-card admin-maintenance-card admin-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="formTitle"
        >
      <div class="admin-panel-card__header">
        <div>
          <p class="section__eyebrow">{{ formState.mode === 'create' ? 'Crear registro' : 'Editar registro' }}</p>
          <h2>{{ formTitle }}</h2>
        </div>
        <button class="button button--secondary" type="button" :disabled="saving" @click="closeForm">Cerrar</button>
      </div>

      <div v-if="formState.mode === 'edit' && formState.item" class="maintenance-context">
        <strong>{{ formState.item.title || formState.item.fullName || formState.item.name }}</strong>
        <p v-if="formState.item.subtitle">{{ formState.item.subtitle }}</p>
        <dl v-if="formState.item.details?.length" class="admin-list__details">
          <div v-for="detailItem in formState.item.details" :key="`${detailItem.label}-${detailItem.value}`">
            <dt>{{ detailItem.label }}</dt>
            <dd>{{ detailItem.value }}</dd>
          </div>
        </dl>
        <div v-if="formState.item.body" class="admin-list__message">
          <span>{{ formState.item.bodyLabel || 'Detalle' }}</span>
          <p>{{ formState.item.body }}</p>
        </div>
      </div>

      <form class="lead-form maintenance-form" @submit.prevent="submitMaintenance">
        <template v-for="field in activeFields" :key="field.name">
          <label
            v-if="field.type === 'checkbox'"
            class="checkbox-field maintenance-form__checkbox"
          >
            <input v-model="formState.values[field.name]" type="checkbox" />
            <span>
              {{ field.label }}
              <small v-if="field.help" class="field-help">{{ field.help }}</small>
            </span>
          </label>

          <label v-else :class="{ 'lead-form__full': field.full || field.type === 'textarea' || field.multiple }">
            <span>{{ field.label }}</span>

            <textarea
              v-if="field.type === 'textarea'"
              v-model="formState.values[field.name]"
              :required="isFieldRequired(field)"
            />

            <select
              v-else-if="field.type === 'select'"
              v-model="formState.values[field.name]"
              :multiple="field.multiple"
              :required="isFieldRequired(field)"
              @change="updateSelectField(field, $event)"
            >
              <option v-if="field.emptyLabel && !field.multiple" value="">{{ field.emptyLabel }}</option>
              <option
                v-for="option in fieldOptions(field)"
                :key="String(option.value)"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>

            <input
              v-else
              v-model="formState.values[field.name]"
              :type="field.type || 'text'"
              :required="isFieldRequired(field)"
              @input="updateDerivedFields(field.name)"
            />
            <small v-if="field.help" class="field-help">{{ field.help }}</small>
          </label>
        </template>

        <div class="lead-form__actions maintenance-form__actions">
          <button class="button button--primary" type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : submitLabel }}
          </button>
          <button class="button button--secondary" type="button" :disabled="saving" @click="closeForm">Cancelar</button>
        </div>

        <p v-if="formFeedback" class="form-message form-message--error lead-form__full">
          {{ formFeedback }}
        </p>
      </form>
        </section>
      </div>

      <div
        v-if="deleteState.open"
        class="admin-modal-backdrop"
        @mousedown.self="closeDeleteModal"
      >
        <section
          class="admin-panel-card admin-delete-modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <p class="section__eyebrow">Confirmar eliminación</p>
          <h2 id="delete-modal-title">¿Eliminar este registro?</h2>
          <p>
            Se eliminará
            <strong>{{ deleteState.item?.title || deleteState.item?.fullName || deleteState.item?.name || 'el registro seleccionado' }}</strong>.
            Esta acción puede estar restringida si existen datos asociados.
          </p>
          <p v-if="actionErrorMessage" class="form-message form-message--error">{{ actionErrorMessage }}</p>
          <div class="admin-delete-modal__actions">
            <button class="button button--secondary" type="button" :disabled="workingAction" @click="closeDeleteModal">
              Cancelar
            </button>
            <button class="button button--danger" type="button" :disabled="workingAction" @click="confirmRemove">
              {{ workingAction ? 'Eliminando...' : 'Sí, eliminar' }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>

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

      <section class="admin-grid admin-grid--stack">
        <AdminDataTable
          v-for="section in moduleState.sections"
          :key="section.title"
          :title="section.title"
          :subtitle="section.subtitle"
          :eyebrow="section.eyebrow"
          :items="section.items"
          :columns="section.columns"
          :empty-message="section.emptyMessage"
          :editable="!!section.editable"
          :deletable="!!section.deletable"
          :toggleable="!!section.toggleable"
          :busy="workingAction"
          :create-label="section.createLabel"
          :action-label="section.actionLabel || 'Editar'"
          @edit="openEditForm"
          @create="openCreateForm(section.maintenanceType)"
          @remove="requestRemove"
          @toggle="toggleItem"
        />
      </section>
    </template>
  </section>
</template>
