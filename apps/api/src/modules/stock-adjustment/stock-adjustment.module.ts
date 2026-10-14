import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockAdjustmentService } from './stock-adjustment.service';
import { StockAdjustmentController } from './stock-adjustment.controller';
import { StockAdjustmentLog } from './entities/stock-adjustment.entity';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockAdjustmentLog]),
    InventoryModule,
  ],
  controllers: [StockAdjustmentController],
  providers: [StockAdjustmentService],
  exports: [StockAdjustmentService],
})
export class StockAdjustmentModule {}
