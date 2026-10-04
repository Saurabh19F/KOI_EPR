import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { GstReportController } from './gst-report.controller';
import { GstReportService } from './services/gst-report.service';
import { SalesInvoice } from '../sales-order/entities/sales-order.entity';
import { PurchaseInvoice } from '../purchase-order/entities/purchase-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesInvoice, PurchaseInvoice]),
  ],
  controllers: [FinancialController, GstReportController],
  providers: [FinancialService, GstReportService],
  exports: [FinancialService, GstReportService],
})
export class FinancialModule {}
