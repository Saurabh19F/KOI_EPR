import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryAdvancedService } from './inventory-advanced.service';
import { InventoryAdvancedController } from './inventory-advanced.controller';
import { InventoryStock } from '../masters/entities/inventory-stock.entity';
import { Warehouse } from '../masters/entities/warehouse.entity';
import { StockMovement } from './entities/stock-movement.entity';
import {
  InventoryBatch,
  InventorySerialNumber,
  StockReservation,
  StockValuation,
  StockCount,
  StockCountItem,
  StockTransfer,
  StockTransferItem,
  ReorderPoint,
  StockLocationTransferLog,
} from './entities';
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
      InventorySerialNumber,
      StockReservation,
      StockValuation,
      StockCount,
      StockCountItem,
      StockTransfer,
      StockTransferItem,
      ReorderPoint,
      StockLocationTransferLog,
    ]),
  ],
  controllers: [InventoryController, InventoryAdvancedController],
  providers: [InventoryService, InventoryAdvancedService],
  exports: [InventoryService, InventoryAdvancedService],
})
export class InventoryModule {}
