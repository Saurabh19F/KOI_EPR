import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceivingPlanController } from './receiving-plan.controller';
import { ReceivingPlanService } from './receiving-plan.service';
import { ReceivingPlanPdfService } from './receiving-plan-pdf.service';
import { ReceivingPlan } from './entities/receiving-plan.entity';
import { PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptNoteItem } from '../purchase-order/entities/purchase-order.entity';
import { Warehouse } from '../masters/entities/warehouse.entity';
import { User } from '../users/entities/user.entity';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReceivingPlan, PurchaseOrder, PurchaseOrderItem, Warehouse, GoodsReceiptNote, GoodsReceiptNoteItem, User]),
    InventoryModule,
  ],
  controllers: [ReceivingPlanController],
  providers: [ReceivingPlanService, ReceivingPlanPdfService],
  exports: [ReceivingPlanService, ReceivingPlanPdfService],
})
export class ReceivingPlanModule {}
