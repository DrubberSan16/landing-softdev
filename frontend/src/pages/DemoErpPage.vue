<script setup>
import { computed, onMounted, ref } from 'vue'
import { erpApi } from '../services/api'
import { clearErpSessionToken, getErpSessionToken, setErpSessionToken } from '../utils/erp-session'

const defaultCredentials = {
  email: 'admin@demoerp.com',
  password: 'DemoERP2026!',
}

const modules = [
  { key: 'dashboard', label: 'Resumen', description: 'Indicadores del negocio' },
  { key: 'customers', label: 'Clientes', description: 'Cartera comercial' },
  { key: 'products', label: 'Inventario', description: 'Productos y stock' },
  { key: 'invoices', label: 'Facturas', description: 'Ventas y cobros' },
  { key: 'suppliers', label: 'Proveedores', description: 'Abastecimiento' },
  { key: 'users', label: 'Usuarios', description: 'Acceso ERP' },
]

const menuSections = [
  {
    type: 'item',
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Componente Dashboard',
    icon: 'DB',
  },
  {
    type: 'group',
    key: 'administration',
    label: 'Administracion',
    description: 'Tag administrativa',
    icon: 'AD',
    children: [
      { key: 'customers', label: 'Clientes', description: 'Cartera comercial', icon: 'CL' },
      { key: 'users', label: 'Usuarios', description: 'Acceso ERP', icon: 'US' },
    ],
  },
  {
    type: 'group',
    key: 'maintenance',
    label: 'Mantenimiento',
    description: 'Tag mantenedor',
    icon: 'MT',
    children: [
      { key: 'products', label: 'Inventario', description: 'Productos y stock', icon: 'PR' },
      { key: 'suppliers', label: 'Proveedores', description: 'Abastecimiento', icon: 'PV' },
    ],
  },
  {
    type: 'group',
    key: 'commercial',
    label: 'Comercial',
    description: 'Ventas y cobros',
    icon: 'CO',
    children: [{ key: 'invoices', label: 'Facturas', description: 'Cabecera y detalle', icon: 'FT' }],
  },
]

const statusOptions = [
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' },
]
const roleOptions = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Ventas', value: 'sales' },
  { label: 'Inventario', value: 'inventory' },
]
const invoiceStatusOptions = [
  { label: 'Borrador', value: 'draft' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Pagada', value: 'paid' },
  { label: 'Cancelada', value: 'cancelled' },
]

const moduleConfigs = {
  customers: {
    title: 'Clientes',
    resource: 'customers',
    createLabel: 'Nuevo cliente',
    columns: [
      { label: 'Nombre', key: 'name', secondaryKey: 'company' },
      { label: 'Correo', key: 'email' },
      { label: 'Telefono', key: 'phone' },
      { label: 'RUC/ID', key: 'taxId' },
      { label: 'Estado', key: 'status' },
    ],
    fields: [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'company', label: 'Empresa' },
      { name: 'email', label: 'Correo', type: 'email', required: true },
      { name: 'phone', label: 'Telefono', required: true },
      { name: 'taxId', label: 'RUC/ID' },
      { name: 'status', label: 'Estado', type: 'select', default: 'active', options: statusOptions },
    ],
  },
  suppliers: {
    title: 'Proveedores',
    resource: 'suppliers',
    createLabel: 'Nuevo proveedor',
    columns: [
      { label: 'Proveedor', key: 'name', secondaryKey: 'contactName' },
      { label: 'Correo', key: 'email' },
      { label: 'Telefono', key: 'phone' },
      { label: 'Estado', key: 'status' },
    ],
    fields: [
      { name: 'name', label: 'Proveedor', required: true },
      { name: 'contactName', label: 'Contacto', required: true },
      { name: 'email', label: 'Correo', type: 'email', required: true },
      { name: 'phone', label: 'Telefono', required: true },
      { name: 'status', label: 'Estado', type: 'select', default: 'active', options: statusOptions },
    ],
  },
  products: {
    title: 'Inventario',
    resource: 'products',
    createLabel: 'Nuevo producto',
    columns: [
      { label: 'Producto', key: 'name', secondaryKey: 'sku' },
      { label: 'Categoria', key: 'category' },
      { label: 'Stock', key: 'stock', secondary: (item) => `Minimo: ${item.minStock}` },
      { label: 'Precio', value: (item) => formatCurrency(item.price), secondary: (item) => `Costo: ${formatCurrency(item.cost)}` },
      { label: 'Estado', key: 'status' },
    ],
    fields: [
      { name: 'sku', label: 'SKU', required: true },
      { name: 'name', label: 'Producto', required: true },
      { name: 'category', label: 'Categoria', required: true },
      { name: 'stock', label: 'Stock', type: 'number', default: 0, required: true },
      { name: 'minStock', label: 'Stock minimo', type: 'number', default: 0, required: true },
      { name: 'price', label: 'Precio', type: 'number', default: 0, required: true },
      { name: 'cost', label: 'Costo', type: 'number', default: 0, required: true },
      { name: 'status', label: 'Estado', type: 'select', default: 'active', options: statusOptions },
    ],
  },
  users: {
    title: 'Usuarios ERP',
    resource: 'users',
    createLabel: 'Nuevo usuario',
    columns: [
      { label: 'Usuario', key: 'fullName', secondaryKey: 'email' },
      { label: 'Rol', key: 'role' },
      { label: 'Estado', key: 'status' },
      { label: 'Creado', value: (item) => formatDate(item.createdAt) },
    ],
    fields: [
      { name: 'fullName', label: 'Nombre', required: true },
      { name: 'email', label: 'Correo', type: 'email', required: true },
      { name: 'role', label: 'Rol', type: 'select', default: 'sales', options: roleOptions },
      { name: 'status', label: 'Estado', type: 'select', default: 'active', options: statusOptions },
      { name: 'password', label: 'Clave', type: 'password', help: 'Si editas y lo dejas vacio, conserva la clave actual.' },
    ],
  },
}

const loading = ref(true)
const busy = ref(false)
const loginError = ref('')
const appError = ref('')
const activeModule = ref('dashboard')
const sidebarOpen = ref(true)
const openMenuGroups = ref({
  administration: true,
  maintenance: true,
  commercial: true,
})
const user = ref(null)
const loginForm = ref({ ...defaultCredentials })
const dashboard = ref(null)
const data = ref({
  customers: [],
  suppliers: [],
  products: [],
  invoices: [],
  users: [],
})
const formState = ref({
  open: false,
  mode: 'create',
  resource: '',
  item: null,
  values: {},
})
const invoiceForm = ref({
  customerId: '',
  status: 'pending',
  dueDate: '',
  detailProductId: '',
  detailQuantity: 1,
  items: [],
})

const isAuthenticated = computed(() => !!user.value)
const activeConfig = computed(() => moduleConfigs[activeModule.value])
const selectedInvoiceCustomer = computed(() => data.value.customers.find((customer) => customer.id === invoiceForm.value.customerId))
const invoiceDetailRows = computed(() =>
  invoiceForm.value.items.map((item) => {
    const product = findProduct(item.productId)
    const unitPrice = Number(product?.price || 0)

    return {
      ...item,
      product,
      productName: product?.name || 'Producto no disponible',
      sku: product?.sku || 'Sin SKU',
      stock: Number(product?.stock || 0),
      unitPrice,
      lineTotal: unitPrice * Number(item.quantity || 0),
    }
  }),
)
const invoiceSubtotal = computed(() => invoiceDetailRows.value.reduce((total, item) => total + item.lineTotal, 0))
const invoiceTax = computed(() => Number((invoiceSubtotal.value * 0.12).toFixed(2)))
const invoiceTotal = computed(() => Number((invoiceSubtotal.value + invoiceTax.value).toFixed(2)))
const canEmitInvoice = computed(() => Boolean(invoiceForm.value.customerId && invoiceForm.value.items.length))

async function boot() {
  const token = getErpSessionToken()

  if (!token) {
    loading.value = false
    return
  }

  try {
    user.value = await erpApi.me()
    await loadAll()
  } catch {
    clearErpSessionToken()
  } finally {
    loading.value = false
  }
}

async function login() {
  busy.value = true
  loginError.value = ''

  try {
    const result = await erpApi.login(loginForm.value)
    setErpSessionToken(result.token)
    user.value = result.user
    await loadAll()
  } catch (error) {
    loginError.value = error.message
  } finally {
    busy.value = false
  }
}

async function logout() {
  try {
    await erpApi.logout()
  } catch {
    // El token puede haber expirado; limpiamos localmente igual.
  } finally {
    clearErpSessionToken()
    user.value = null
    activeModule.value = 'dashboard'
  }
}

async function loadAll() {
  appError.value = ''
  const [dashboardPayload, customers, suppliers, products, invoices, users] = await Promise.all([erpApi.getDashboard(), erpApi.list('customers'), erpApi.list('suppliers'), erpApi.list('products'), erpApi.list('invoices'), erpApi.list('users')])
  dashboard.value = dashboardPayload
  data.value = { customers, suppliers, products, invoices, users }
}

function setModule(moduleKey) {
  activeModule.value = moduleKey
  appError.value = ''
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function toggleMenuGroup(groupKey) {
  openMenuGroups.value[groupKey] = !openMenuGroups.value[groupKey]
}

function isMenuGroupOpen(groupKey) {
  return Boolean(openMenuGroups.value[groupKey])
}

function isMenuGroupActive(section) {
  return section.children?.some((child) => child.key === activeModule.value)
}

function statusLabel(value) {
  return [...statusOptions, ...invoiceStatusOptions, ...roleOptions].find((item) => item.value === value)?.label || value
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('es-EC', {
    style: 'currency',
    currency: 'USD',
  })
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha'
  }

  return new Date(value).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function columnValue(column, item) {
  if (column.value) {
    return column.value(item)
  }

  return item[column.key] || 'No registrado'
}

function secondaryValue(column, item) {
  if (column.secondary) {
    return column.secondary(item)
  }

  return column.secondaryKey ? item[column.secondaryKey] : ''
}

function buildInitialValues(config, item = null) {
  return config.fields.reduce((values, field) => {
    values[field.name] = item?.[field.name] ?? field.default ?? ''

    if (field.type === 'number') {
      values[field.name] = Number(values[field.name] || 0)
    }

    if (formState.value.mode === 'edit' && field.name === 'password') {
      values[field.name] = ''
    }

    return values
  }, {})
}

function openCreate(resource) {
  const config = moduleConfigs[resource]
  formState.value = {
    open: true,
    mode: 'create',
    resource,
    item: null,
    values: buildInitialValues(config),
  }
}

function openEdit(resource, item) {
  const config = moduleConfigs[resource]
  formState.value = {
    open: true,
    mode: 'edit',
    resource,
    item,
    values: buildInitialValues(config, item),
  }
}

function closeForm() {
  formState.value.open = false
}

function normalizePayload(config) {
  return config.fields.reduce((payload, field) => {
    const value = formState.value.values[field.name]

    if (field.name === 'password' && !value) {
      return payload
    }

    payload[field.name] = field.type === 'number' ? Number(value || 0) : String(value ?? '').trim()
    return payload
  }, {})
}

async function saveForm() {
  const config = moduleConfigs[formState.value.resource]
  busy.value = true
  appError.value = ''

  try {
    const payload = normalizePayload(config)

    if (formState.value.mode === 'create') {
      await erpApi.create(config.resource, payload)
    } else {
      await erpApi.update(config.resource, formState.value.item.id, payload)
    }

    closeForm()
    await loadAll()
  } catch (error) {
    appError.value = error.message
  } finally {
    busy.value = false
  }
}

async function removeRecord(resource, item) {
  if (!window.confirm(`Eliminar ${item.name || item.fullName || item.number}?`)) {
    return
  }

  busy.value = true
  appError.value = ''

  try {
    await erpApi.remove(resource, item.id)
    await loadAll()
  } catch (error) {
    appError.value = error.message
  } finally {
    busy.value = false
  }
}

function findProduct(productId) {
  return data.value.products.find((product) => product.id === productId)
}

function addInvoiceItem() {
  appError.value = ''
  const product = findProduct(invoiceForm.value.detailProductId)
  const quantity = Number(invoiceForm.value.detailQuantity || 0)

  if (!product) {
    appError.value = 'Selecciona un producto para agregarlo al detalle.'
    return
  }

  if (quantity < 1) {
    appError.value = 'La cantidad debe ser mayor a cero.'
    return
  }

  const existing = invoiceForm.value.items.find((item) => item.productId === product.id)
  const requestedQuantity = Number(existing?.quantity || 0) + quantity

  if (requestedQuantity > Number(product.stock || 0)) {
    appError.value = 'No hay stock suficiente para ' + product.name + '. Disponible: ' + product.stock + '.'
    return
  }

  if (existing) {
    existing.quantity = requestedQuantity
  } else {
    invoiceForm.value.items.push({
      productId: product.id,
      quantity,
    })
  }

  invoiceForm.value.detailProductId = ''
  invoiceForm.value.detailQuantity = 1
}

function removeInvoiceItem(productId) {
  invoiceForm.value.items = invoiceForm.value.items.filter((item) => item.productId !== productId)
}

function resetInvoiceForm() {
  invoiceForm.value = {
    customerId: '',
    status: 'pending',
    dueDate: '',
    detailProductId: '',
    detailQuantity: 1,
    items: [],
  }
}

async function createInvoice() {
  if (!canEmitInvoice.value) {
    appError.value = 'Completa la cabecera y agrega al menos un producto al detalle.'
    return
  }

  busy.value = true
  appError.value = ''

  try {
    await erpApi.create('invoices', {
      customerId: invoiceForm.value.customerId,
      status: invoiceForm.value.status,
      dueDate: invoiceForm.value.dueDate || undefined,
      items: invoiceForm.value.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity || 1),
      })),
    })
    resetInvoiceForm()
    await loadAll()
  } catch (error) {
    appError.value = error.message
  } finally {
    busy.value = false
  }
}

async function updateInvoiceStatus(invoice, status) {
  busy.value = true
  appError.value = ''

  try {
    await erpApi.updateInvoiceStatus(invoice.id, { status })
    await loadAll()
  } catch (error) {
    appError.value = error.message
  } finally {
    busy.value = false
  }
}

onMounted(boot)
</script>

<template>
  <main class="erp-app">
    <section v-if="loading" class="erp-login">
      <div class="erp-login__card">
        <p class="section__eyebrow">EasyERP Demo</p>
        <h1>Cargando plataforma ERP...</h1>
      </div>
    </section>

    <section v-else-if="!isAuthenticated" class="erp-login">
      <div class="erp-login__card">
        <p class="section__eyebrow">Demo independiente</p>
        <h1>EasyERP</h1>
        <p>Una mini plataforma para probar clientes, inventario, facturacion, proveedores y usuarios sin entrar al panel administrativo de la landing.</p>

        <form class="erp-login__form" @submit.prevent="login">
          <label>
            <span>Correo</span>
            <input v-model="loginForm.email" type="email" required />
          </label>
          <label>
            <span>Clave</span>
            <input v-model="loginForm.password" type="password" required />
          </label>
          <button class="button button--primary" type="submit" :disabled="busy">
            {{ busy ? 'Ingresando...' : 'Ingresar al ERP' }}
          </button>
        </form>

        <div class="erp-credentials">
          <strong>Credenciales demo</strong>
          <span>admin@demoerp.com</span>
          <span>DemoERP2026!</span>
        </div>

        <p v-if="loginError" class="form-message form-message--error">{{ loginError }}</p>
      </div>
    </section>

    <section v-else class="erp-shell" :class="{ 'is-sidebar-collapsed': !sidebarOpen }">
      <aside class="erp-sidebar" :aria-expanded="sidebarOpen">
        <div class="erp-sidebar__top">
          <div class="erp-profile">
            <span class="erp-profile__logo">ERP</span>
            <div class="erp-profile__text">
              <strong>EasyERP Demo</strong>
              <small>{{ user.fullName }}</small>
            </div>
          </div>

          <button class="erp-sidebar-toggle" type="button" :aria-label="sidebarOpen ? 'Cerrar menu' : 'Abrir menu'" @click="toggleSidebar">
            <span>{{ sidebarOpen ? 'Cerrar' : 'Abrir' }}</span>
            <b>{{ sidebarOpen ? '-' : '+' }}</b>
          </button>
        </div>

        <div class="erp-account-card">
          <span>CUENTA ACTIVA</span>
          <strong>{{ user.email }}</strong>
        </div>

        <div class="erp-welcome-link">
          <span class="erp-nav-icon">IN</span>
          <strong>Bienvenid@</strong>
        </div>

        <nav class="erp-nav" aria-label="Modulos ERP">
          <template v-for="section in menuSections" :key="section.key">
            <button v-if="section.type === 'item'" class="erp-nav-item" :class="{ 'is-active': activeModule === section.key }" type="button" :title="section.label" @click="setModule(section.key)">
              <span class="erp-nav-icon">{{ section.icon }}</span>
              <span class="erp-nav-copy">
                <strong>{{ section.label }}</strong>
                <small>{{ section.description }}</small>
              </span>
            </button>

            <div v-else class="erp-nav-group" :class="{ 'is-open': isMenuGroupOpen(section.key), 'is-active': isMenuGroupActive(section) }">
              <button class="erp-nav-item erp-nav-item--group" type="button" :title="section.label" @click="toggleMenuGroup(section.key)">
                <span class="erp-nav-icon">{{ section.icon }}</span>
                <span class="erp-nav-copy">
                  <strong>{{ section.label }}</strong>
                  <small>{{ section.description }}</small>
                </span>
                <span class="erp-nav-caret">{{ isMenuGroupOpen(section.key) ? '^' : 'v' }}</span>
              </button>

              <div v-if="isMenuGroupOpen(section.key)" class="erp-nav-children">
                <button v-for="child in section.children" :key="child.key" class="erp-nav-child" :class="{ 'is-active': activeModule === child.key }" type="button" :title="child.label" @click="setModule(child.key)">
                  <span class="erp-nav-child__icon">{{ child.icon }}</span>
                  <span>
                    <strong>{{ child.label }}</strong>
                    <small>{{ child.description }}</small>
                  </span>
                </button>
              </div>
            </div>
          </template>
        </nav>

        <div class="erp-user-card">
          <span>Rol actual</span>
          <strong>{{ statusLabel(user.role) }}</strong>
          <button class="button button--secondary" type="button" @click="logout">Cerrar sesion</button>
        </div>
      </aside>

      <div class="erp-main">
        <header class="erp-header">
          <div>
            <p class="section__eyebrow">Sistema demo</p>
            <h1>{{ modules.find((item) => item.key === activeModule)?.label }}</h1>
          </div>
          <div class="erp-header__actions">
            <button class="button button--secondary" type="button" @click="toggleSidebar">
              {{ sidebarOpen ? 'Ocultar menu' : 'Mostrar menu' }}
            </button>
            <a class="button button--secondary" href="/" target="_blank" rel="noopener noreferrer"> Ver landing </a>
          </div>
        </header>

        <p v-if="appError" class="form-message form-message--error">{{ appError }}</p>

        <section v-if="activeModule === 'dashboard'" class="erp-dashboard">
          <div class="erp-kpi-grid">
            <article v-for="stat in dashboard?.stats || []" :key="stat.label" class="erp-kpi-card">
              <span>{{ stat.label }}</span>
              <strong>{{ stat.label.includes('Ventas') || stat.label.includes('Cuentas') ? formatCurrency(stat.value) : stat.value }}</strong>
              <small>{{ stat.caption }}</small>
            </article>
          </div>

          <div class="erp-dashboard-grid">
            <article class="erp-panel">
              <h2>Facturas recientes</h2>
              <div v-for="invoice in dashboard?.recentInvoices || []" :key="invoice.id" class="erp-row">
                <div>
                  <strong>{{ invoice.number }}</strong>
                  <span>{{ invoice.customerName }}</span>
                </div>
                <b>{{ formatCurrency(invoice.total) }}</b>
              </div>
            </article>

            <article class="erp-panel">
              <h2>Alertas de inventario</h2>
              <div v-for="product in dashboard?.lowStock || []" :key="product.id" class="erp-row">
                <div>
                  <strong>{{ product.name }}</strong>
                  <span>{{ product.sku }}</span>
                </div>
                <b>{{ product.stock }} / {{ product.minStock }}</b>
              </div>
              <p v-if="!dashboard?.lowStock?.length">Inventario sin alertas.</p>
            </article>
          </div>
        </section>

        <section v-else-if="activeModule === 'invoices'" class="erp-panel">
          <div class="erp-panel__header">
            <div>
              <h2>Facturacion</h2>
              <p>Crea una venta, descuenta stock y cambia su estado de cobro.</p>
            </div>
          </div>

          <form class="erp-invoice-builder" @submit.prevent="createInvoice">
            <section class="erp-invoice-card erp-invoice-card--header">
              <div>
                <p class="section__eyebrow">Cabecera</p>
                <h3>Datos generales de la factura</h3>
              </div>

              <div class="erp-invoice-header-grid">
                <label>
                  <span>Cliente</span>
                  <select v-model="invoiceForm.customerId" required>
                    <option value="">Selecciona un cliente</option>
                    <option v-for="customer in data.customers" :key="customer.id" :value="customer.id">
                      {{ customer.company || customer.name }}
                    </option>
                  </select>
                </label>

                <label>
                  <span>Estado de cobro</span>
                  <select v-model="invoiceForm.status">
                    <option v-for="status in invoiceStatusOptions" :key="status.value" :value="status.value">
                      {{ status.label }}
                    </option>
                  </select>
                </label>

                <label>
                  <span>Vencimiento</span>
                  <input v-model="invoiceForm.dueDate" type="date" />
                </label>
              </div>

              <div v-if="selectedInvoiceCustomer" class="erp-customer-snapshot">
                <strong>{{ selectedInvoiceCustomer.company || selectedInvoiceCustomer.name }}</strong>
                <span>{{ selectedInvoiceCustomer.email }} - {{ selectedInvoiceCustomer.phone }}</span>
                <small>RUC/ID: {{ selectedInvoiceCustomer.taxId || 'No registrado' }}</small>
              </div>
            </section>

            <section class="erp-invoice-card erp-invoice-card--detail">
              <div>
                <p class="section__eyebrow">Detalle</p>
                <h3>Productos a facturar</h3>
              </div>

              <div class="erp-detail-entry">
                <label>
                  <span>Producto</span>
                  <select v-model="invoiceForm.detailProductId">
                    <option value="">Selecciona un producto</option>
                    <option v-for="product in data.products" :key="product.id" :value="product.id" :disabled="product.status !== 'active' || product.stock <= 0">{{ product.name }} - {{ formatCurrency(product.price) }} - stock {{ product.stock }}</option>
                  </select>
                </label>

                <label>
                  <span>Cantidad</span>
                  <input v-model.number="invoiceForm.detailQuantity" type="number" min="1" />
                </label>

                <button class="button button--secondary" type="button" @click="addInvoiceItem">Agregar al detalle</button>
              </div>

              <div v-if="invoiceDetailRows.length" class="erp-detail-table">
                <div class="erp-detail-row erp-detail-row--head">
                  <span>Producto</span>
                  <span>Cantidad</span>
                  <span>Precio</span>
                  <span>Total linea</span>
                  <span></span>
                </div>
                <div v-for="item in invoiceDetailRows" :key="item.productId" class="erp-detail-row">
                  <div>
                    <strong>{{ item.productName }}</strong>
                    <small>{{ item.sku }} - stock actual {{ item.stock }}</small>
                  </div>
                  <span>{{ item.quantity }}</span>
                  <span>{{ formatCurrency(item.unitPrice) }}</span>
                  <strong>{{ formatCurrency(item.lineTotal) }}</strong>
                  <button class="button button--danger erp-small-button" type="button" @click="removeInvoiceItem(item.productId)">Quitar</button>
                </div>
              </div>
              <p v-else class="erp-invoice-empty">Agrega productos al detalle para calcular el subtotal, IVA y total antes de emitir.</p>
            </section>

            <aside class="erp-invoice-card erp-invoice-summary">
              <p class="section__eyebrow">Resumen</p>
              <h3>Total de emision</h3>
              <div class="erp-total-row">
                <span>Subtotal</span>
                <strong>{{ formatCurrency(invoiceSubtotal) }}</strong>
              </div>
              <div class="erp-total-row">
                <span>IVA 12%</span>
                <strong>{{ formatCurrency(invoiceTax) }}</strong>
              </div>
              <div class="erp-total-row erp-total-row--strong">
                <span>Total</span>
                <strong>{{ formatCurrency(invoiceTotal) }}</strong>
              </div>
              <button class="button button--primary" type="submit" :disabled="busy || !canEmitInvoice">
                {{ busy ? 'Emitiendo...' : 'Emitir factura' }}
              </button>
              <button class="button button--secondary" type="button" @click="resetInvoiceForm">Limpiar factura</button>
              <p>Al emitir, el ERP descuenta inventario. Si la factura se cancela o elimina, el stock se repone automaticamente.</p>
            </aside>
          </form>

          <div class="erp-table-wrap">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>Cabecera</th>
                  <th>Cliente</th>
                  <th>Detalle</th>
                  <th>Valores</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="invoice in data.invoices" :key="invoice.id">
                  <td>
                    <strong>{{ invoice.number }}</strong>
                    <small>Emitida: {{ formatDate(invoice.createdAt) }}</small>
                    <small>Vence: {{ formatDate(invoice.dueDate) }}</small>
                  </td>
                  <td>{{ invoice.customerName }}</td>
                  <td>
                    <small v-for="item in invoice.items" :key="invoice.id + '-' + item.productId"> {{ item.quantity }} x {{ item.productName }} </small>
                  </td>
                  <td>
                    <strong>{{ formatCurrency(invoice.total) }}</strong>
                    <small>Subtotal {{ formatCurrency(invoice.subtotal) }}</small>
                    <small>IVA {{ formatCurrency(invoice.tax) }}</small>
                  </td>
                  <td>
                    <select :value="invoice.status" @change="updateInvoiceStatus(invoice, $event.target.value)">
                      <option v-for="status in invoiceStatusOptions" :key="status.value" :value="status.value">
                        {{ status.label }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <button class="button button--danger erp-small-button" type="button" @click="removeRecord('invoices', invoice)">Eliminar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-else class="erp-panel">
          <div class="erp-panel__header">
            <div>
              <h2>{{ activeConfig.title }}</h2>
              <p>Gestiona registros del modulo y prueba altas, cambios y eliminaciones.</p>
            </div>
            <button class="button button--primary" type="button" @click="openCreate(activeModule)">
              {{ activeConfig.createLabel }}
            </button>
          </div>

          <div class="erp-table-wrap">
            <table class="erp-table">
              <thead>
                <tr>
                  <th v-for="column in activeConfig.columns" :key="column.label">{{ column.label }}</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in data[activeModule]" :key="item.id">
                  <td v-for="column in activeConfig.columns" :key="column.label">
                    <strong>{{ columnValue(column, item) }}</strong>
                    <small v-if="secondaryValue(column, item)">{{ secondaryValue(column, item) }}</small>
                  </td>
                  <td>
                    <div class="erp-actions">
                      <button class="button button--secondary erp-small-button" type="button" @click="openEdit(activeModule, item)">Editar</button>
                      <button class="button button--danger erp-small-button" type="button" @click="removeRecord(activeConfig.resource, item)">Eliminar</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>

    <div v-if="formState.open" class="erp-modal-backdrop" @mousedown.self="closeForm">
      <section class="erp-modal">
        <div class="erp-panel__header">
          <div>
            <p class="section__eyebrow">{{ formState.mode === 'create' ? 'Crear' : 'Editar' }}</p>
            <h2>{{ moduleConfigs[formState.resource].title }}</h2>
          </div>
          <button class="button button--secondary" type="button" @click="closeForm">Cerrar</button>
        </div>

        <form class="erp-form-grid" @submit.prevent="saveForm">
          <label v-for="field in moduleConfigs[formState.resource].fields" :key="field.name">
            <span>{{ field.label }}</span>
            <select v-if="field.type === 'select'" v-model="formState.values[field.name]" :required="field.required">
              <option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input v-else v-model="formState.values[field.name]" :type="field.type || 'text'" :required="field.required" :min="field.type === 'number' ? 0 : undefined" />
            <small v-if="field.help">{{ field.help }}</small>
          </label>

          <div class="erp-form-actions">
            <button class="button button--primary" type="submit" :disabled="busy">
              {{ busy ? 'Guardando...' : 'Guardar' }}
            </button>
            <button class="button button--secondary" type="button" @click="closeForm">Cancelar</button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
