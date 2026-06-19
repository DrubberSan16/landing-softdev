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
      { name: 'status', label: 'Estado del seguimiento', type: 'select', options: () => statusOptions.contact, required: true, help: 'Indica en qué etapa comercial se encuentra la solicitud.' },
      { name: 'assignedToPublicId', label: 'Responsable', type: 'select', options: userOptions, emptyLabel: 'Sin responsable', nullable: true, help: 'Persona del equipo encargada de responder y dar seguimiento.' },
      { name: 'firstResponseAt', label: 'Fecha de primera respuesta', type: 'datetime-local', nullable: true },
      { name: 'closedAt', label: 'Fecha de cierre', type: 'datetime-local', nullable: true },
      { name: 'adminNotes', label: 'Notas internas', type: 'textarea', nullable: true, full: true, help: 'Solo son visibles para el equipo administrativo.' },
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
    description: 'Administra los proyectos que aparecen en el portafolio público. Revisa su visibilidad, contenido y rendimiento antes de publicarlos.',
    stats: buildStats([
      { label: 'Total listado', value: payload.meta?.total || items.length, caption: 'proyectos registrados' },
      { label: 'Publicados visibles', value: items.filter((item) => item.status === 'published').length, caption: 'entre los proyectos recientes' },
      { label: 'Destacados visibles', value: items.filter((item) => item.isFeatured).length, caption: 'entre los proyectos recientes' },
    ]),
    sections: [
      {
        eyebrow: 'Portafolio',
        title: 'Proyectos recientes',
        subtitle: 'Cada ficha resume cómo se publica el proyecto y el interés que ha generado.',
        editable: true,
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
        items: items.map((item) => withEditMeta({
          ...item,
          title: item.name,
          subtitle: item.description || 'Esta categoría todavía no tiene una descripción.',
          badge: item.status ? 'Activa' : 'Inactiva',
          details: [detail('Identificador web', item.slug), detail('Orden de aparición', item.sortOrder ?? 0)],
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
        title: 'Solicitudes recientes',
        subtitle: 'Ordenadas desde la más reciente. Usa “Gestionar solicitud” para asignar responsable, estado y notas internas.',
        editable: true,
        actionLabel: 'Gestionar solicitud',
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
      { label: 'Activos visibles', value: items.filter((item) => item.status === 'active').length, caption: 'entre los usuarios recientes' },
      { label: 'Roles', value: roles.length, caption: 'perfiles disponibles en el sistema' },
    ]),
    sections: [
      {
        eyebrow: 'Acceso al panel',
        title: 'Usuarios recientes',
        subtitle: 'Personas que pueden iniciar sesión en este panel y permisos asociados a su cuenta.',
        editable: true,
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
        })),
        emptyMessage: 'No hay usuarios administrativos registrados.',
      },
      {
        eyebrow: 'Perfiles de acceso',
        title: 'Roles disponibles',
        subtitle: 'Perfiles que pueden asignarse a los usuarios.',
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
        items: roles.map((item) => ({
          ...item,
          title: item.name,
          subtitle: item.description || item.code,
          badge: `${item.permissions?.length || 0} permisos`,
          details: [
            detail('Código interno', item.code),
            detail('Rol protegido del sistema', yesNo(item.isSystem)),
            detail('Permisos incluidos', item.permissions?.map((permission) => permission.code).join(', ')),
          ],
        })),
        emptyMessage: 'No hay roles disponibles.',
      },
      {
        eyebrow: 'Acciones autorizadas',
        title: 'Catalogo de permisos',
        subtitle: 'Permisos utilizables para construir reglas de acceso.',
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
    adminApi.getNotificationQueue({ page: 1, limit: 12 }),
    adminApi.getNotificationChannels(),
    adminApi.getNotificationTemplates(),
    adminApi.getNotificationPreferences(),
  ])
  const queue = queuePayload.items || []

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
        title: 'Canales y plantillas',
        subtitle: 'Base de entrega automatica definida en el sistema.',
        items: [
          ...channels.map((item) => ({
            ...item,
            title: item.name,
            subtitle: item.description || item.code,
            badge: item.isActive ? 'Canal activo' : 'Canal inactivo',
            details: [detail('Código interno', item.code)],
          })),
          ...templates.slice(0, 6).map((item) => ({
            ...item,
            title: item.name,
            subtitle: `${item.eventCode} | ${item.channelName}`,
            badge: item.isActive ? 'Plantilla activa' : 'Plantilla inactiva',
            details: [detail('Asunto', item.subjectTemplate)],
          })),
        ],
        emptyMessage: 'No hay canales ni plantillas configuradas.',
      },
      {
        eyebrow: 'Preferencias personales',
        title: 'Preferencias administrativas',
        subtitle: 'Configuracion por usuario y canal para eventos del sistema.',
        editable: true,
        actionLabel: 'Cambiar preferencia',
        items: preferences.slice(0, 12).map((item) => withEditMeta({
          ...item,
          title: item.adminUserFullName,
          subtitle: `Evento: ${item.eventCode}`,
          badge: item.isEnabled ? 'Habilitada' : 'Deshabilitada',
          details: [detail('Canal', item.channelName)],
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
            <small v-if="field.help" class="field-help">{{ field.help }}</small>
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
          :eyebrow="section.eyebrow"
          :items="section.items"
          :empty-message="section.emptyMessage"
          :editable="!!section.editable"
          :action-label="section.actionLabel || 'Editar'"
          @edit="openEditForm"
        />
      </section>
    </template>
  </section>
</template>
