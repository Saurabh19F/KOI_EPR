import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RateService } from './rate.service';
import { RateController } from './rate.controller';
import { CalculationEngineService } from './services/calculation-engine.service';
import { PriceAnalysis } from './entities/price-analysis.entity';
import { PriceAnalysisItem } from './entities/price-analysis-item.entity';
import { CurrencyRate } from './entities/currency-rate.entity';
import { HaulageRate } from './entities/haulage-master.entity';
import { FinalCurrencyRateMaster } from './entities/final-currency-rate-master.entity';
import { FreightRate } from './entities/freight-master.entity';
import { FormulaMaster } from './entities/formula-master.entity';
import { RateVersion } from './entities/rate-version.entity';
import { CommonModule } from '../../common/common.module';
import { PurchaseQuote } from '../purchase/entities/purchase-quote.entity';
import { PurchaseQuoteItem } from '../purchase/entities/purchase-quote-item.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    CommonModule,
    AuditModule,
    TypeOrmModule.forFeature([
      PriceAnalysis,
      PriceAnalysisItem,
      CurrencyRate,
      HaulageRate,
      FinalCurrencyRateMaster,
      FreightRate,
      FormulaMaster,
      RateVersion,
      PurchaseQuote,
      PurchaseQuoteItem,
    ]),
  ],
  controllers: [RateController],
  providers: [RateService, CalculationEngineService],
  exports: [RateService, CalculationEngineService],
})
export class RateModule {}