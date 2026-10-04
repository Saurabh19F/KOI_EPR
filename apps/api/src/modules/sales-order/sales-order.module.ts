import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderController } from './sales-order.controller';
import { SalesOrderService } from './sales-order.service';
import { SalesInvoicePdfService } from './sales-invoice-pdf.service';
import { SalesQuotationPdfService } from './sales-quotation-pdf.service';
import { SalesOrderSheetPdfService } from './sales-order-sheet-pdf.service';
import { SalesOrderEventsListener } from './sales-order-events.listener';
import { NotificationsModule } from '../notifications/notifications.module';

// Entities
import {
  SalesOrder,
  SalesOrderItem,
  DeliveryNote,
  DeliveryNoteItem,
  SalesInvoice,
  SalesInvoiceItem,
  CreditNote,
} from './entities/sales-order.entity';
import { AccountsReceivable } from '../financial/entities/accounting-voucher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderItem,
      DeliveryNote,
      DeliveryNoteItem,
      SalesInvoice,
      SalesInvoiceItem,
      CreditNote,
      AccountsReceivable,
    ]),
    NotificationsModule,
  ],
  controllers: [SalesOrderController],
  providers: [SalesOrderService, SalesInvoicePdfService, SalesQuotationPdfService, SalesOrderSheetPdfService, SalesOrderEventsListener],
  exports: [SalesOrderService],
})
export class SalesOrderModule {}
