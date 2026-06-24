import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ErpLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ErpCustomerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsIn(['active', 'inactive'])
  @IsOptional()
  status?: string;
}

export class ErpSupplierDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  contactName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsIn(['active', 'inactive'])
  @IsOptional()
  status?: string;
}

export class ErpProductDto {
  @IsString()
  @MinLength(2)
  sku: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  category: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsInt()
  @Min(0)
  minStock: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsIn(['active', 'inactive'])
  @IsOptional()
  status?: string;
}

export class ErpInvoiceItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;
}

export class ErpInvoiceDto {
  @IsString()
  customerId: string;

  @IsIn(['draft', 'pending', 'paid', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ErpInvoiceItemDto)
  items: ErpInvoiceItemDto[];
}

export class ErpInvoiceStatusDto {
  @IsIn(['draft', 'pending', 'paid', 'cancelled'])
  status: string;
}

export class ErpUserDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEmail()
  email: string;

  @IsIn(['admin', 'sales', 'inventory'])
  role: string;

  @IsIn(['active', 'inactive'])
  @IsOptional()
  status?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
