import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import { QualityLog, RejectActionLog } from './entities/quality.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QualityLog, RejectActionLog])],
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
