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
  productId: '',
  quantity: 1,
  status: 'pending',
  dueDate: '',
})

const isAuthenticated = computed(() => !!user.value)
const activeConfig = computed(() => moduleConfigs[activeModule.value])

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

async function createInvoice() {
  busy.value = true
  appError.value = ''

  try {
    await erpApi.create('invoices', {
      customerId: invoiceForm.value.customerId,
      status: invoiceForm.value.status,
      dueDate: invoiceForm.value.dueDate || undefined,
      items: [
        {
          productId: invoiceForm.value.productId,
          quantity: Number(invoiceForm.value.quantity || 1),
        },
      ],
    })
    invoiceForm.value = { customerId: '', productId: '', quantity: 1, status: 'pending', dueDate: '' }
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

    <section v-else class="erp-shell">
      <aside class="erp-sidebar">
        <div class="erp-brand">
          <span>ERP</span>
          <div>
            <strong>EasyERP Demo</strong>
            <small>Aplicacion separada</small>
          </div>
        </div>

        <button v-for="module in modules" :key="module.key" class="erp-nav-button" :class="{ 'is-active': activeModule === module.key }" type="button" @click="setModule(module.key)">
          <strong>{{ module.label }}</strong>
          <small>{{ module.description }}</small>
        </button>

        <div class="erp-user-card">
          <strong>{{ user.fullName }}</strong>
          <span>{{ user.email }}</span>
          <small>{{ statusLabel(user.role) }}</small>
          <button class="button button--secondary" type="button" @click="logout">Cerrar sesion</button>
        </div>
      </aside>

      <div class="erp-main">
        <header class="erp-header">
          <div>
            <p class="section__eyebrow">Sistema demo</p>
            <h1>{{ modules.find((item) => item.key === activeModule)?.label }}</h1>
          </div>
          <a class="button button--secondary" href="/" target="_blank" rel="noopener noreferrer"> Ver landing </a>
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

          <form class="erp-inline-form" @submit.prevent="createInvoice">
            <select v-model="invoiceForm.customerId" required>
              <option value="">Cliente</option>
              <option v-for="customer in data.customers" :key="customer.id" :value="customer.id">
                {{ customer.company || customer.name }}
              </option>
            </select>
            <select v-model="invoiceForm.productId" required>
              <option value="">Producto</option>
              <option v-for="product in data.products" :key="product.id" :value="product.id">{{ product.name }} - stock {{ product.stock }}</option>
            </select>
            <input v-model="invoiceForm.quantity" type="number" min="1" placeholder="Cantidad" required />
            <select v-model="invoiceForm.status">
              <option v-for="status in invoiceStatusOptions" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
            <input v-model="invoiceForm.dueDate" type="date" />
            <button class="button button--primary" type="submit" :disabled="busy">Crear factura</button>
          </form>

          <div class="erp-table-wrap">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Cliente</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="invoice in data.invoices" :key="invoice.id">
                  <td>
                    <strong>{{ invoice.number }}</strong>
                    <small>{{ formatDate(invoice.createdAt) }}</small>
                  </td>
                  <td>{{ invoice.customerName }}</td>
                  <td>
                    <small v-for="item in invoice.items" :key="`${invoice.id}-${item.productId}`"> {{ item.quantity }} x {{ item.productName }} </small>
                  </td>
                  <td>{{ formatCurrency(invoice.total) }}</td>
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
