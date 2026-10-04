import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { POLedgerEntry } from './entities/po-ledger.entity';
import { PurchaseOrder } from '../purchase-order/entities/purchase-order.entity';
import { PurchaseIndentOrder, PurchaseIndentItem } from '../purchase/entities/purchase-indent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([POLedgerEntry, PurchaseOrder, PurchaseIndentOrder, PurchaseIndentItem]),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
