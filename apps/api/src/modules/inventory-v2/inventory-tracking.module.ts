import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryTrackingController } from './inventory-tracking.controller';
import { InventoryTrackingService } from './inventory-tracking.service';
import { EventBusModule } from '../events/event-bus.module';

// Entities
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
} from './entities/inventory-tracking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryBatch,
      InventorySerialNumber,
      StockReservation,
      StockValuation,
      StockCount,
      StockCountItem,
      StockTransfer,
      StockTransferItem,
      ReorderPoint,
    ]),
    EventBusModule,
  ],
  controllers: [InventoryTrackingController],
  providers: [InventoryTrackingService],
  exports: [InventoryTrackingService],
})
export class InventoryV2Module {}
