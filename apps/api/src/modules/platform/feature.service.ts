import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feature, FeatureCategory } from './entities/feature.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';

@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Feature)
    private featureRepository: Repository<Feature>,
    @InjectRepository(PlanFeature)
    private planFeatureRepository: Repository<PlanFeature>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
  ) {}

  async getAllFeatures(): Promise<Feature[]> {
    return this.featureRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getFeaturesByCategory(category: FeatureCategory): Promise<Feature[]> {
    return this.featureRepository.find({
      where: { category, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getPlanFeatures(planId: string): Promise<PlanFeature[]> {
    return this.planFeatureRepository.find({
      where: { planId },
    });
  }

  async isFeatureEnabled(planId: string, featureCode: string): Promise<boolean> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });

    if (!plan) {
      return false;
    }

    return true;
  }

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { monthlyPriceInr: 'ASC' },
    });
  }

  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    return this.planRepository.findOne({ where: { id: planId } });
  }

  async seedFeatures(): Promise<void> {
    const features = [
      { featureCode: 'sales_enquiry', name: 'Sales Enquiry', category: FeatureCategory.SALES, sortOrder: 1 },
      { featureCode: 'purchase_quote', name: 'Purchase Quote', category: FeatureCategory.PURCHASE, sortOrder: 2 },
      { featureCode: 'price_analysis', name: 'Price Analysis', category: FeatureCategory.RATE, sortOrder: 3 },
      { featureCode: 'label_artwork', name: 'Label & Artwork', category: FeatureCategory.RATE, sortOrder: 4 },
      { featureCode: 'vendor_management', name: 'Vendor Management', category: FeatureCategory.PURCHASE, sortOrder: 5 },
      { featureCode: 'fms', name: 'File Management', category: FeatureCategory.FMS, sortOrder: 6 },
      { featureCode: 'product_master', name: 'Product Master', category: FeatureCategory.MASTERS, sortOrder: 7 },
      { featureCode: 'customer_master', name: 'Customer Master', category: FeatureCategory.MASTERS, sortOrder: 8 },
    ];

    for (const featureData of features) {
      const existing = await this.featureRepository.findOne({
        where: { featureCode: featureData.featureCode },
      });

      if (!existing) {
        await this.featureRepository.save(this.featureRepository.create(featureData));
      }
    }
  }
}
