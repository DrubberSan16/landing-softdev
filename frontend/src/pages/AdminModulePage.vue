<script setup>
import { computed, ref, watch } from 'vue'
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
const saving = ref(false)
const successMessage = ref('')
const formFeedback = ref('')
const formOptions = ref({
  categories: [],
  technologies: [],
  roles: [],
  users: [],
})
const formState = ref({
  open: false,
  mode: 'create',
  type: '',
  item: null,
  values: {},
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
    canEdit: true,
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
      { name: 'isFeatured', label: 'Destacado en landing', type: 'checkbox', default: false },
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
  },
  contacts: {
    editTitle: (item) => `Actualizar ${item.fullName}`,
    fields: () => [
      { name: 'status', label: 'Estado', type: 'select', options: () => statusOptions.contact, required: true },
      { name: 'assignedToPublicId', label: 'Responsable', type: 'select', options: userOptions, emptyLabel: 'Sin responsable', nullable: true },
      { name: 'firstResponseAt', label: 'Primera respuesta', type: 'datetime-local', nullable: true },
      { name: 'closedAt', label: 'Cierre', type: 'datetime-local', nullable: true },
      { name: 'adminNotes', label: 'Notas internas', type: 'textarea', nullable: true, full: true },
    ],
    update: (item, payload) => adminApi.updateContact(item.publicId, payload),
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
  },
  notifications: {
    types: {
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

function openCreateForm() {
  const config = getMaintenanceConfig()

  if (!config?.canCreate) {
    return
  }

  successMessage.value = ''
  formFeedback.value = ''
  formState.value = {
    open: true,
    mode: 'create',
    type: '',
    item: null,
    values: buildInitialValues(config, null, 'create'),
  }
}

function openEditForm(item) {
  const config = getMaintenanceConfig(item.maintenanceType || '')

  if (!config?.update) {
    return
  }

  successMessage.value = ''
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

async function loadProjectsModule() {
  const [payload, categories, technologies] = await Promise.all([
    adminApi.getProjects({ page: 1, limit: 12 }),
    adminApi.getCategories(),
    adminApi.getTechnologies(),
  ])
  const items = payload.items || []
  formOptions.value.categories = categories
  formOptions.value.technologies = technologies

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
        editable: true,
        items: items.map((item) => withEditMeta({
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
        title: 'Listado actual',
        subtitle: 'Categorias ordenadas segun la configuracion del panel.',
        editable: true,
        items: items.map((item) => withEditMeta({
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
        title: 'Stack administrado',
        subtitle: 'Tecnologias disponibles para asociar a demos.',
        editable: true,
        items: items.map((item) => withEditMeta({
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
  const [payload, usersPayload] = await Promise.all([
    adminApi.getContacts({ page: 1, limit: 12 }),
    adminApi.getUsers({ page: 1, limit: 100 }),
  ])
  const items = payload.items || []
  formOptions.value.users = usersPayload.items || []

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
        editable: true,
        items: items.map((item) => withEditMeta({
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
  formOptions.value.roles = roles

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
        editable: true,
        items: items.map((item) => withEditMeta({
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
        editable: true,
        items: queue.map((item) => withEditMeta({
          ...item,
          title: item.eventCode,
          subtitle: `${item.channelName} | ${item.recipientTo || 'sin destinatario'} | ${formatDate(item.createdAt)}`,
          badge: item.status,
        }, 'queue')),
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
        editable: true,
        items: preferences.slice(0, 12).map((item) => withEditMeta({
          ...item,
          title: item.adminUserFullName,
          subtitle: `${item.eventCode} | ${item.channelName}`,
          badge: item.isEnabled ? 'habilitada' : 'deshabilitada',
        }, 'preference')),
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
      <div class="admin-page__summary">
        <p>{{ moduleState.description || 'Preparando informacion del modulo seleccionado.' }}</p>
        <button
          v-if="currentMaintenanceConfig?.canCreate"
          class="button button--primary"
          type="button"
          @click="openCreateForm"
        >
          {{ currentMaintenanceConfig.createLabel || 'Crear registro' }}
        </button>
      </div>
    </header>

    <p v-if="successMessage" class="form-message form-message--success">{{ successMessage }}</p>

    <section v-if="formState.open" class="admin-panel-card admin-maintenance-card">
      <div class="admin-panel-card__header">
        <div>
          <p class="section__eyebrow">Mantenimiento</p>
          <h2>{{ formTitle }}</h2>
        </div>
        <button class="button button--secondary" type="button" @click="closeForm">Cancelar</button>
      </div>

      <form class="lead-form maintenance-form" @submit.prevent="submitMaintenance">
        <template v-for="field in activeFields" :key="field.name">
          <label
            v-if="field.type === 'checkbox'"
            class="checkbox-field maintenance-form__checkbox"
          >
            <input v-model="formState.values[field.name]" type="checkbox" />
            <span>{{ field.label }}</span>
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
          </label>
        </template>

        <div class="lead-form__actions maintenance-form__actions">
          <button class="button button--primary" type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : submitLabel }}
          </button>
          <button class="button button--secondary" type="button" @click="closeForm">Cancelar</button>
        </div>

        <p v-if="formFeedback" class="form-message form-message--error lead-form__full">
          {{ formFeedback }}
        </p>
      </form>
    </section>

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
          :editable="!!section.editable"
          action-label="Editar"
          @edit="openEditForm"
        />
      </section>
    </template>
  </section>
</template>
