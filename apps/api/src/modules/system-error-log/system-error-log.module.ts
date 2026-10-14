import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemErrorLogService } from './system-error-log.service';
import { SystemErrorLogController } from './system-error-log.controller';
import { SystemErrorLog } from './entities/system-error-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemErrorLog])],
  controllers: [SystemErrorLogController],
  providers: [SystemErrorLogService],
  exports: [SystemErrorLogService],
})
export class SystemErrorLogModule {}
