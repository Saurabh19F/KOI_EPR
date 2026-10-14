import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import {
  ProductionJob,
  ProductionLog,
  ProductionMergeDetail,
  ProductionMaterialClosure,
  BillOfMaterial,
  BomItem,
} from './entities/production.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionJob,
      ProductionLog,
      ProductionMergeDetail,
      ProductionMaterialClosure,
      BillOfMaterial,
      BomItem,
    ]),
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
