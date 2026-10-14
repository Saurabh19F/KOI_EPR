import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesEnquiryOrder } from './entities/sales-enquiry.entity';
import { SalesEnquiryOrderItem } from './entities/sales-enquiry-item.entity';
import { SalesEnquiryDocument } from './entities/sales-enquiry-document.entity';
import { EnquiryPunchingLog } from './entities/enquiry-punching-log.entity';
import { EnquiryEmailReminder } from './entities/enquiry-email-reminder.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { CommonModule } from '../../common/common.module';
import { User } from '../users/entities/user.entity';
import { Customer } from '../masters/entities/customer.entity';
import { MastersModule } from '../masters/masters.module';
import { RateModule } from '../rate/rate.module';
import { SalesOrderModule } from '../sales-order/sales-order.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => MastersModule),
    forwardRef(() => RateModule),
    SalesOrderModule,
    TypeOrmModule.forFeature([
      SalesEnquiryOrder,
      SalesEnquiryOrderItem,
      SalesEnquiryDocument,
      EnquiryPunchingLog,
      EnquiryEmailReminder,
      User,
      Customer,
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
