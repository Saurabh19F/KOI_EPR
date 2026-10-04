import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseQuote } from './entities/purchase-quote.entity';
import { PurchaseQuoteItem } from './entities/purchase-quote-item.entity';
import { VendorQuote } from './entities/vendor-quote.entity';
import { PurchaseLandingCost } from './entities/purchase-landing-cost.entity';
import { PurchaseLabel } from './entities/purchase-label.entity';
import { PurchaseIndentItem, PurchaseIndentOrder } from './entities/purchase-indent.entity';
import { PurchaseService } from './purchase.service';
import { PurchaseIndentService } from './purchase-indent.service';
import { PurchaseController } from './purchase.controller';
import { QuotationPdfService } from './quotation-pdf.service';
import { CommonModule } from '../../common/common.module';
import { RateModule } from '../rate/rate.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => RateModule),
    TypeOrmModule.forFeature([
      PurchaseQuote,
      PurchaseQuoteItem,
      VendorQuote,
      PurchaseLandingCost,
      PurchaseLabel,
      PurchaseIndentItem,
      PurchaseIndentOrder,
    ]),
  ],
  controllers: [PurchaseController],
  providers: [PurchaseService, PurchaseIndentService, QuotationPdfService],
  exports: [PurchaseService, PurchaseIndentService],
})
export class PurchaseModule {}
