import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ApprovalMatrix } from './entities/approval-matrix.entity';
import { NumberSeries } from './entities/number-series.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { HelpTicket } from './entities/help-ticket.entity';
import { Department } from '../users/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApprovalMatrix,
      NumberSeries,
      EmailTemplate,
      SystemSetting,
      HelpTicket,
      Department,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
