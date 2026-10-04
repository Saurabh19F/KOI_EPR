import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { SalesEnquiryOrder } from '../sales/entities/sales-enquiry.entity';
import { SalesEnquiryOrderItem } from '../sales/entities/sales-enquiry-item.entity';
import { PurchaseQuote } from '../purchase/entities/purchase-quote.entity';
import { PurchaseQuoteItem } from '../purchase/entities/purchase-quote-item.entity';
import { PriceAnalysis } from '../rate/entities/price-analysis.entity';
import { FmsTask } from '../fms/entities/fms-task.entity';
import { Product } from '../masters/entities/product.entity';
import { Customer } from '../masters/entities/customer.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      SalesEnquiryOrder,
      SalesEnquiryOrderItem,
      PurchaseQuote,
      PurchaseQuoteItem,
      PriceAnalysis,
      FmsTask,
      Product,
      Customer,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
