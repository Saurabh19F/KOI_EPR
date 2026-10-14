import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceivingPlanController } from './receiving-plan.controller';
import { ReceivingPlanService } from './receiving-plan.service';
import { ReceivingPlan } from './entities/receiving-plan.entity';
import { PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptNoteItem } from '../purchase-order/entities/purchase-order.entity';
import { Warehouse } from '../masters/entities/warehouse.entity';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReceivingPlan, PurchaseOrder, PurchaseOrderItem, Warehouse, GoodsReceiptNote, GoodsReceiptNoteItem]),
    InventoryModule,
  ],
  controllers: [ReceivingPlanController],
  providers: [ReceivingPlanService],
  exports: [ReceivingPlanService],
})
export class ReceivingPlanModule {}
