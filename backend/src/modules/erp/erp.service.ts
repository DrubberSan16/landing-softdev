import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ErpCustomerDto,
  ErpInvoiceDto,
  ErpInvoiceStatusDto,
  ErpProductDto,
  ErpSupplierDto,
  ErpUserDto,
} from './dto/erp.dto';

type ErpUser = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'sales' | 'inventory';
  status: 'active' | 'inactive';
  createdAt: string;
};

type ErpCustomer = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  taxId: string;
  status: 'active' | 'inactive';
  createdAt: string;
};

type ErpSupplier = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
};

type ErpProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  status: 'active' | 'inactive';
  createdAt: string;
};

type ErpInvoice = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  status: 'draft' | 'pending' | 'paid' | 'cancelled';
  dueDate: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
};

type ErpInvoiceItem = ErpInvoice['items'][number];

type ErpSession = {
  token: string;
  userId: string;
  expiresAt: number;
};

@Injectable()
export class ErpService {
  private readonly sessions = new Map<string, ErpSession>();

  private users: ErpUser[] = [
    {
      id: 'usr-admin',
      fullName: 'Administrador ERP',
      email: 'admin@demoerp.com',
      password: 'DemoERP2026!',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-sales',
      fullName: 'Laura Ventas',
      email: 'ventas@demoerp.com',
      password: 'DemoERP2026!',
      role: 'sales',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-inventory',
      fullName: 'Marco Inventario',
      email: 'inventario@demoerp.com',
      password: 'DemoERP2026!',
      role: 'inventory',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  private customers: ErpCustomer[] = [
    {
      id: 'cus-001',
      name: 'Mariana Torres',
      company: 'Torres Home Design',
      email: 'mariana@torreshome.ec',
      phone: '0991002003',
      taxId: '1790012345001',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cus-002',
      name: 'Diego Viteri',
      company: 'Viteri Retail',
      email: 'diego@viteriretail.ec',
      phone: '0985554411',
      taxId: '0997654321001',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  private suppliers: ErpSupplier[] = [
    {
      id: 'sup-001',
      name: 'Maderas Andinas',
      contactName: 'Paola Cevallos',
      email: 'ventas@maderasandinas.ec',
      phone: '022345678',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sup-002',
      name: 'Herrajes Pro',
      contactName: 'Santiago Molina',
      email: 'contacto@herrajespro.ec',
      phone: '042221133',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  private products: ErpProduct[] = [
    {
      id: 'prd-001',
      sku: 'ERP-DOOR-001',
      name: 'Puerta interior premium',
      category: 'Productos terminados',
      stock: 18,
      minStock: 5,
      price: 320,
      cost: 190,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prd-002',
      sku: 'ERP-SERVICE-001',
      name: 'Servicio de instalacion',
      category: 'Servicios',
      stock: 999,
      minStock: 0,
      price: 85,
      cost: 45,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prd-003',
      sku: 'ERP-HINGE-001',
      name: 'Kit de bisagras reforzadas',
      category: 'Insumos',
      stock: 4,
      minStock: 10,
      price: 24,
      cost: 12,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  private invoices: ErpInvoice[] = [
    {
      id: 'inv-001',
      number: 'ERP-0001',
      customerId: 'cus-001',
      customerName: 'Torres Home Design',
      status: 'paid',
      dueDate: this.addDays(7),
      items: [
        {
          productId: 'prd-001',
          productName: 'Puerta interior premium',
          quantity: 2,
          unitPrice: 320,
          lineTotal: 640,
        },
      ],
      subtotal: 640,
      tax: 76.8,
      total: 716.8,
      createdAt: new Date().toISOString(),
    },
  ];

  login(email: string, password: string) {
    const user = this.users.find(
      (item) =>
        item.email.toLowerCase() === email.toLowerCase() &&
        item.password === password,
    );

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Credenciales ERP invalidas.');
    }

    const token = randomUUID();
    this.sessions.set(token, {
      token,
      userId: user.id,
      expiresAt: Date.now() + 1000 * 60 * 60 * 8,
    });

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  logout(token: string) {
    this.sessions.delete(token);
    return { message: 'Sesion ERP cerrada correctamente.' };
  }

  requireSession(token: string) {
    const session = this.sessions.get(token);

    if (!session || session.expiresAt < Date.now()) {
      if (session) {
        this.sessions.delete(token);
      }

      throw new UnauthorizedException('La sesion ERP no esta activa.');
    }

    const user = this.users.find((item) => item.id === session.userId);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('El usuario ERP no esta activo.');
    }

    return this.sanitizeUser(user);
  }

  dashboard() {
    const receivables = this.invoices
      .filter((invoice) => invoice.status === 'pending')
      .reduce((total, invoice) => total + invoice.total, 0);
    const paidSales = this.invoices
      .filter((invoice) => invoice.status === 'paid')
      .reduce((total, invoice) => total + invoice.total, 0);
    const lowStock = this.products.filter(
      (product) =>
        product.status === 'active' && product.stock <= product.minStock,
    );

    return {
      stats: [
        {
          label: 'Ventas cobradas',
          value: paidSales,
          caption: 'facturas pagadas en el demo',
        },
        {
          label: 'Cuentas por cobrar',
          value: receivables,
          caption: 'facturas pendientes',
        },
        {
          label: 'Clientes activos',
          value: this.customers.filter((item) => item.status === 'active')
            .length,
          caption: 'cartera disponible',
        },
        {
          label: 'Alertas de inventario',
          value: lowStock.length,
          caption: 'productos bajo minimo',
        },
      ],
      lowStock,
      recentInvoices: this.invoices.slice().reverse().slice(0, 5),
    };
  }

  listCustomers() {
    return this.customers;
  }

  createCustomer(payload: ErpCustomerDto) {
    const customer: ErpCustomer = {
      id: `cus-${randomUUID().slice(0, 8)}`,
      name: payload.name,
      company: payload.company ?? '',
      email: payload.email,
      phone: payload.phone,
      taxId: payload.taxId ?? '',
      status: (payload.status ?? 'active') as ErpCustomer['status'],
      createdAt: new Date().toISOString(),
    };
    this.customers.push(customer);
    return customer;
  }

  updateCustomer(id: string, payload: ErpCustomerDto) {
    const customer = this.findById(this.customers, id, 'cliente');
    Object.assign(customer, {
      name: payload.name,
      company: payload.company ?? '',
      email: payload.email,
      phone: payload.phone,
      taxId: payload.taxId ?? '',
      status: payload.status ?? customer.status,
    });
    return customer;
  }

  removeCustomer(id: string) {
    this.customers = this.customers.filter((item) => item.id !== id);
    return { message: 'Cliente eliminado.' };
  }

  listSuppliers() {
    return this.suppliers;
  }

  createSupplier(payload: ErpSupplierDto) {
    const supplier: ErpSupplier = {
      id: `sup-${randomUUID().slice(0, 8)}`,
      name: payload.name,
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone,
      status: (payload.status ?? 'active') as ErpSupplier['status'],
      createdAt: new Date().toISOString(),
    };
    this.suppliers.push(supplier);
    return supplier;
  }

  updateSupplier(id: string, payload: ErpSupplierDto) {
    const supplier = this.findById(this.suppliers, id, 'proveedor');
    Object.assign(supplier, {
      name: payload.name,
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone,
      status: payload.status ?? supplier.status,
    });
    return supplier;
  }

  removeSupplier(id: string) {
    this.suppliers = this.suppliers.filter((item) => item.id !== id);
    return { message: 'Proveedor eliminado.' };
  }

  listProducts() {
    return this.products;
  }

  createProduct(payload: ErpProductDto) {
    this.ensureUniqueProductSku(payload.sku);
    const product: ErpProduct = {
      id: `prd-${randomUUID().slice(0, 8)}`,
      sku: payload.sku,
      name: payload.name,
      category: payload.category,
      stock: Number(payload.stock),
      minStock: Number(payload.minStock),
      price: Number(payload.price),
      cost: Number(payload.cost),
      status: (payload.status ?? 'active') as ErpProduct['status'],
      createdAt: new Date().toISOString(),
    };
    this.products.push(product);
    return product;
  }

  updateProduct(id: string, payload: ErpProductDto) {
    const product = this.findById(this.products, id, 'producto');
    this.ensureUniqueProductSku(payload.sku, id);
    Object.assign(product, {
      sku: payload.sku,
      name: payload.name,
      category: payload.category,
      stock: Number(payload.stock),
      minStock: Number(payload.minStock),
      price: Number(payload.price),
      cost: Number(payload.cost),
      status: payload.status ?? product.status,
    });
    return product;
  }

  removeProduct(id: string) {
    this.products = this.products.filter((item) => item.id !== id);
    return { message: 'Producto eliminado.' };
  }

  listInvoices() {
    return this.invoices;
  }

  createInvoice(payload: ErpInvoiceDto) {
    if (!payload.items?.length) {
      throw new BadRequestException(
        'Agrega al menos un producto a la factura.',
      );
    }

    const customer = this.findById(
      this.customers,
      payload.customerId,
      'cliente',
    );
    const items = payload.items.map((item) => {
      const product = this.findById(this.products, item.productId, 'producto');

      if (product.status !== 'active') {
        throw new BadRequestException(
          `El producto ${product.name} no esta activo.`,
        );
      }

      return {
        productId: product.id,
        productName: product.name,
        quantity: Number(item.quantity),
        unitPrice: product.price,
        lineTotal: product.price * Number(item.quantity),
      };
    });

    this.reserveInvoiceItems(items);

    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
    const tax = Number((subtotal * 0.12).toFixed(2));
    const invoice: ErpInvoice = {
      id: `inv-${randomUUID().slice(0, 8)}`,
      number: `ERP-${String(this.invoices.length + 1).padStart(4, '0')}`,
      customerId: customer.id,
      customerName: customer.company || customer.name,
      status: (payload.status ?? 'pending') as ErpInvoice['status'],
      dueDate: payload.dueDate || this.addDays(15),
      items,
      subtotal,
      tax,
      total: Number((subtotal + tax).toFixed(2)),
      createdAt: new Date().toISOString(),
    };
    this.invoices.push(invoice);
    return invoice;
  }

  updateInvoiceStatus(id: string, payload: ErpInvoiceStatusDto) {
    const invoice = this.findById(this.invoices, id, 'factura');
    const nextStatus = payload.status as ErpInvoice['status'];

    if (invoice.status !== nextStatus) {
      if (invoice.status !== 'cancelled' && nextStatus === 'cancelled') {
        this.restoreInvoiceItems(invoice.items);
      }

      if (invoice.status === 'cancelled' && nextStatus !== 'cancelled') {
        this.reserveInvoiceItems(invoice.items);
      }

      invoice.status = nextStatus;
    }

    return invoice;
  }

  removeInvoice(id: string) {
    const invoice = this.findById(this.invoices, id, 'factura');

    if (invoice.status !== 'cancelled') {
      this.restoreInvoiceItems(invoice.items);
    }

    this.invoices = this.invoices.filter((item) => item.id !== id);
    return { message: 'Factura eliminada.' };
  }

  listUsers() {
    return this.users.map((user) => this.sanitizeUser(user));
  }

  createUser(payload: ErpUserDto) {
    this.ensureUniqueUserEmail(payload.email);
    const user: ErpUser = {
      id: `usr-${randomUUID().slice(0, 8)}`,
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password || 'DemoERP2026!',
      role: payload.role as ErpUser['role'],
      status: (payload.status ?? 'active') as ErpUser['status'],
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    return this.sanitizeUser(user);
  }

  updateUser(id: string, payload: ErpUserDto) {
    const user = this.findById(this.users, id, 'usuario');
    this.ensureUniqueUserEmail(payload.email, id);
    Object.assign(user, {
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role as ErpUser['role'],
      status: payload.status ?? user.status,
    });

    if (payload.password) {
      user.password = payload.password;
    }

    return this.sanitizeUser(user);
  }

  removeUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException(
        'No puedes eliminar tu propio usuario ERP.',
      );
    }

    this.users = this.users.filter((item) => item.id !== id);
    return { message: 'Usuario eliminado.' };
  }

  private findById<T extends { id: string }>(
    items: T[],
    id: string,
    label: string,
  ) {
    const item = items.find((entry) => entry.id === id);

    if (!item) {
      throw new NotFoundException(`No se encontro el ${label} solicitado.`);
    }

    return item;
  }

  private sanitizeUser(user: ErpUser) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  private reserveInvoiceItems(items: ErpInvoiceItem[]) {
    const quantitiesByProduct = this.groupInvoiceQuantities(items);

    for (const [productId, quantity] of quantitiesByProduct) {
      const product = this.findById(this.products, productId, 'producto');

      if (product.stock < quantity) {
        throw new BadRequestException(
          `No hay stock suficiente para ${product.name}. Disponible: ${product.stock}.`,
        );
      }
    }

    for (const [productId, quantity] of quantitiesByProduct) {
      const product = this.findById(this.products, productId, 'producto');
      product.stock -= quantity;
    }
  }

  private restoreInvoiceItems(items: ErpInvoiceItem[]) {
    const quantitiesByProduct = this.groupInvoiceQuantities(items);

    for (const [productId, quantity] of quantitiesByProduct) {
      const product = this.findById(this.products, productId, 'producto');
      product.stock += quantity;
    }
  }

  private groupInvoiceQuantities(items: ErpInvoiceItem[]) {
    return items.reduce((grouped, item) => {
      grouped.set(
        item.productId,
        (grouped.get(item.productId) ?? 0) + item.quantity,
      );
      return grouped;
    }, new Map<string, number>());
  }

  private ensureUniqueUserEmail(email: string, currentId?: string) {
    const duplicated = this.users.some(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.id !== currentId,
    );

    if (duplicated) {
      throw new BadRequestException('Ya existe un usuario ERP con ese correo.');
    }
  }

  private ensureUniqueProductSku(sku: string, currentId?: string) {
    const duplicated = this.products.some(
      (product) =>
        product.sku.toLowerCase() === sku.toLowerCase() &&
        product.id !== currentId,
    );

    if (duplicated) {
      throw new BadRequestException('Ya existe un producto con ese SKU.');
    }
  }

  private addDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
