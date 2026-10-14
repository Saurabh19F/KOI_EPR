import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryTrackingService } from './inventory-tracking.service';
import { InventoryTrackingController } from './inventory-tracking.controller';
import { InventoryStock } from '../masters/entities/inventory-stock.entity';
import { Warehouse } from '../masters/entities/warehouse.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { InventoryBatch } from './entities/batch.entity';
import { Product } from '../masters/entities/product.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      InventoryStock,
      Warehouse,
      StockMovement,
      InventoryBatch,
      Product,
    ]),
  ],
  controllers: [InventoryController, InventoryTrackingController],
  providers: [InventoryService, InventoryTrackingService],
  exports: [InventoryService, InventoryTrackingService],
})
export class InventoryModule {}
