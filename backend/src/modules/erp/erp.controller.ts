import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ErpCustomerDto,
  ErpInvoiceDto,
  ErpInvoiceStatusDto,
  ErpLoginDto,
  ErpProductDto,
  ErpSupplierDto,
  ErpUserDto,
} from './dto/erp.dto';
import { ErpService } from './erp.service';

@ApiTags('Demo ERP')
@ApiBearerAuth('erp-session-token')
@Controller('erp')
export class ErpController {
  constructor(private readonly erpService: ErpService) {}

  @Post('auth/login')
  @ApiOperation({ summary: 'Iniciar sesion en el demo ERP' })
  login(@Body() payload: ErpLoginDto) {
    return this.erpService.login(payload.email, payload.password);
  }

  @Get('auth/me')
  @ApiOperation({ summary: 'Obtener usuario ERP autenticado' })
  me(@Headers('authorization') authorization?: string) {
    return this.erpService.requireSession(this.getToken(authorization));
  }

  @Post('auth/logout')
  @ApiOperation({ summary: 'Cerrar sesion ERP' })
  logout(@Headers('authorization') authorization?: string) {
    return this.erpService.logout(this.getToken(authorization));
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Resumen operativo del demo ERP' })
  dashboard(@Headers('authorization') authorization?: string) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.dashboard();
  }

  @Get('customers')
  listCustomers(@Headers('authorization') authorization?: string) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.listCustomers();
  }

  @Post('customers')
  createCustomer(
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: ErpCustomerDto,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.createCustomer(payload);
  }

  @Patch('customers/:id')
  updateCustomer(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() payload: ErpCustomerDto,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.updateCustomer(id, payload);
  }

  @Delete('customers/:id')
  removeCustomer(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.removeCustomer(id);
  }

  @Get('suppliers')
  listSuppliers(@Headers('authorization') authorization?: string) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.listSuppliers();
  }

  @Post('suppliers')
  createSupplier(
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: ErpSupplierDto,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.createSupplier(payload);
  }

  @Patch('suppliers/:id')
  updateSupplier(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() payload: ErpSupplierDto,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.updateSupplier(id, payload);
  }

  @Delete('suppliers/:id')
  removeSupplier(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.removeSupplier(id);
  }

  @Get('products')
  listProducts(@Headers('authorization') authorization?: string) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.listProducts();
  }

  @Post('products')
  createProduct(
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: ErpProductDto,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.createProduct(payload);
  }

  @Patch('products/:id')
  updateProduct(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() payload: ErpProductDto,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.updateProduct(id, payload);
  }

  @Delete('products/:id')
  removeProduct(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.removeProduct(id);
  }

  @Get('invoices')
  listInvoices(@Headers('authorization') authorization?: string) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.listInvoices();
  }

  @Post('invoices')
  createInvoice(
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: ErpInvoiceDto,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.createInvoice(payload);
  }

  @Patch('invoices/:id/status')
  updateInvoiceStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() payload: ErpInvoiceStatusDto,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.updateInvoiceStatus(id, payload);
  }

  @Delete('invoices/:id')
  removeInvoice(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.removeInvoice(id);
  }

  @Get('users')
  listUsers(@Headers('authorization') authorization?: string) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.listUsers();
  }

  @Post('users')
  createUser(
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: ErpUserDto,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.createUser(payload);
  }

  @Patch('users/:id')
  updateUser(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() payload: ErpUserDto,
  ) {
    this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.updateUser(id, payload);
  }

  @Delete('users/:id')
  removeUser(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const user = this.erpService.requireSession(this.getToken(authorization));
    return this.erpService.removeUser(id, user.id);
  }

  private getToken(authorization?: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Debes enviar un token ERP valido.');
    }

    const token = authorization.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new UnauthorizedException('Debes enviar un token ERP valido.');
    }

    return token;
  }
}
