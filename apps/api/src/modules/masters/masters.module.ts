import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { Segment } from './entities/segment.entity';
import { ComponentGroup } from './entities/component-group.entity';
import { Brand } from './entities/brand.entity';
import { Product } from './entities/product.entity';
import { Uom } from './entities/uom.entity';
import { GstRate } from './entities/gst-rate.entity';
import { Customer } from './entities/customer.entity';
import { Zone } from './entities/zone.entity';
import { Location } from './entities/location.entity';
import { PaymentTerms } from './entities/payment-terms.entity';
import { Currency } from './entities/currency.entity';
import { CurrencyRate } from './entities/currency-rate.entity';
import { Port } from './entities/port.entity';
import { FreightRate } from './entities/freight.entity';
import { HaulageCharge } from './entities/haulage.entity';
import { Country } from './entities/country.entity';
import { MastersService } from './masters.service';
import { MastersController } from './masters.controller';
import { CommonModule } from '../../common/common.module';
import { SalesEnquiryOrderItem } from '../sales/entities/sales-enquiry-item.entity';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      ProductCategory,
      Segment,
      ComponentGroup,
      Brand,
      Product,
      Uom,
      GstRate,
      Customer,
      SalesEnquiryOrderItem,
      Zone,
      Location,
      PaymentTerms,
      Currency,
      CurrencyRate,
      Port,
      FreightRate,
      HaulageCharge,
      Country,
    ]),
  ],
  controllers: [MastersController],
  providers: [MastersService],
  exports: [MastersService],
})
export class MastersModule {}

