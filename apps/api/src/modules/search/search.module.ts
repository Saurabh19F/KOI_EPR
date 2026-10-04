import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Product } from '../masters/entities/product.entity';
import { Customer } from '../masters/entities/customer.entity';
import { ProductCategory } from '../masters/entities/product-category.entity';
import { Brand } from '../masters/entities/brand.entity';
import { SalesEnquiryOrder } from '../sales/entities/sales-enquiry.entity';
import { PurchaseQuote } from '../purchase/entities/purchase-quote.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { InventoryStock } from '../masters/entities/inventory-stock.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Customer,
      ProductCategory,
      Brand,
      SalesEnquiryOrder,
      PurchaseQuote,
      AuditLog,
      InventoryStock,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
