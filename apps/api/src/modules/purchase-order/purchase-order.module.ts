import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderPdfService } from './purchase-order-pdf.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import {
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceiptNote,
  GoodsReceiptNoteItem,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  DebitNote,
  VendorMaster,
  POApproval,
} from './entities/purchase-order.entity';
import { AccountsPayable } from '../financial/entities/accounting-voucher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderItem,
      GoodsReceiptNote,
      GoodsReceiptNoteItem,
      PurchaseInvoice,
      PurchaseInvoiceItem,
      DebitNote,
      VendorMaster,
      POApproval,
      AccountsPayable,
    ]),
  ],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService, PurchaseOrderPdfService],
  exports: [PurchaseOrderService, PurchaseOrderPdfService],
})
export class PurchaseOrderModule {}
