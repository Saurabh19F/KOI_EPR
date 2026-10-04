import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FmsService } from './fms.service';
import { FmsController } from './fms.controller';
import { FmsProcessor } from './processors/fms.processor';
import { queuesEnabled } from '../../common/queue.config';

// FMS Entities
import { FmsTask } from './entities/fms-task.entity';
import { FmsStep } from './entities/fms-step.entity';
import { FMSTaskStep } from './entities/fms-task-step.entity';
import { FmsMailQueue } from './entities/fms-mail-queue.entity';
import { FmsMaster } from './entities/fms-master.entity';
import { RateFMSTask } from './entities/rate-fms-task.entity';
import { LabelArtwork } from './entities/label-artwork.entity';
import { QualityFmsTask } from './entities/quality-fms-task.entity';
import { PoTracking } from './entities/po-tracking.entity';

const isQueueEnabled = queuesEnabled();

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FmsTask,
      FmsStep,
      FMSTaskStep,
      FmsMailQueue,
      FmsMaster,
      RateFMSTask,
      LabelArtwork,
      QualityFmsTask,
      PoTracking,
    ]),
  ],
  controllers: [FmsController],
  providers: [
    FmsService,
    ...(isQueueEnabled ? [FmsProcessor] : []),
  ],
  exports: [FmsService],
})
export class FmsModule {}
