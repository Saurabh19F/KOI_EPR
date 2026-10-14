import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NumberSeries } from '../modules/admin/entities/number-series.entity';
import { NumberSeriesService } from './utils/number-series';
import { TenantService } from './tenant/tenant.service';

@Module({
  imports: [TypeOrmModule.forFeature([NumberSeries])],
  providers: [NumberSeriesService, TenantService],
  exports: [NumberSeriesService, TenantService],
})
export class CommonModule {}
