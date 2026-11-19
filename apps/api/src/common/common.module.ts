import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NumberSeries } from '../modules/admin/entities/number-series.entity';
import { NumberSeriesService } from './utils/number-series';
import { TenantService } from './tenant/tenant.service';
import { RedisCacheService } from './services/redis-cache.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([NumberSeries])],
  providers: [NumberSeriesService, TenantService, RedisCacheService],
  exports: [NumberSeriesService, TenantService, RedisCacheService],
})
export class CommonModule {}
