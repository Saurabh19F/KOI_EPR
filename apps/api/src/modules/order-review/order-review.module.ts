import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderReviewController } from './order-review.controller';
import { OrderReviewService } from './order-review.service';
import {
  OrderReviewDraft,
  OrderFinalSubmission,
  OrderReviewLog,
  OrderItemTask,
  OrderTaskEmailLog,
  OrderItemCancellation,
  OrderClosure,
} from './entities/order-review.entity';
import { SalesOrder, SalesOrderItem } from '../sales-order/entities/sales-order.entity';
import { Department } from '../users/entities/department.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderReviewDraft,
      OrderFinalSubmission,
      OrderReviewLog,
      OrderItemTask,
      OrderTaskEmailLog,
      OrderItemCancellation,
      OrderClosure,
      SalesOrder,
      SalesOrderItem,
      Department,
      User,
    ]),
  ],
  controllers: [OrderReviewController],
  providers: [OrderReviewService],
  exports: [OrderReviewService],
})
export class OrderReviewModule {}
