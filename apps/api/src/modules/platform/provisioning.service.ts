import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Company, CompanyStatus, SubscriptionStatus } from './entities/company.entity';
import { CompanyBranding } from './entities/company-branding.entity';
import { CompanySettings } from './entities/company-settings.entity';
import { CompanyContact } from './entities/company-contact.entity';
import { Subscription } from './entities/subscription.entity';
import { ProvisioningJob, ProvisioningStatus } from './entities/provisioning-job.entity';
import { OnboardingChecklist } from './entities/onboarding-checklist.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { ContactType } from './entities/company-contact.entity';

export interface ProvisioningData {
  companyName: string;
  legalName?: string;
  email: string;
  phone?: string;
  country?: string;
  industry?: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  planCode?: string;
  trialDays?: number;
}

@Injectable()
export class ProvisioningService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(CompanyBranding)
    private brandingRepository: Repository<CompanyBranding>,
    @InjectRepository(CompanySettings)
    private settingsRepository: Repository<CompanySettings>,
    @InjectRepository(CompanyContact)
    private contactRepository: Repository<CompanyContact>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(ProvisioningJob)
    private provisioningJobRepository: Repository<ProvisioningJob>,
    @InjectRepository(OnboardingChecklist)
    private onboardingRepository: Repository<OnboardingChecklist>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
  ) {}

  async provisionTenant(data: ProvisioningData): Promise<{ companyId: string; jobId: string }> {
    // Create provisioning job
    const jobId = uuidv4();
    const companyId = uuidv4();

    const job = this.provisioningJobRepository.create({
      companyId,
      jobId,
      status: ProvisioningStatus.IN_PROGRESS,
      totalTasks: 10,
      currentTask: 'Starting provisioning...',
    });

    await this.provisioningJobRepository.save(job);

    try {
      // Execute provisioning tasks
      await this.executeProvisioningTasks(companyId, jobId, data);

      // Update job as completed
      await this.provisioningJobRepository.update({ jobId }, {
        status: ProvisioningStatus.COMPLETED,
        completedTasks: 10,
        completedAt: new Date(),
      });

      return { companyId, jobId };
    } catch (error) {
      await this.provisioningJobRepository.update({ jobId }, {
        status: ProvisioningStatus.FAILED,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  private async executeProvisioningTasks(companyId: string, jobId: string, data: ProvisioningData): Promise<void> {
    const tasks = [
      { name: 'CREATE_COMPANY', execute: () => this.createCompany(companyId, data) },
      { name: 'CREATE_BRANDING', execute: () => this.createBranding(companyId, data) },
      { name: 'CREATE_SETTINGS', execute: () => this.createSettings(companyId, data) },
      { name: 'CREATE_CONTACTS', execute: () => this.createContacts(companyId, data) },
      { name: 'CREATE_SUBSCRIPTION', execute: () => this.createSubscription(companyId, data) },
      { name: 'CREATE_DEFAULT_ROLES', execute: () => this.createDefaultRoles(companyId) },
      { name: 'CREATE_ADMIN_USER', execute: () => this.createAdminUser(companyId, data) },
      { name: 'SEED_NUMBER_SERIES', execute: () => this.seedNumberSeries(companyId) },
      { name: 'SEED_MASTERS', execute: () => this.seedMasters(companyId) },
      { name: 'CREATE_ONBOARDING_CHECKLIST', execute: () => this.createOnboardingChecklist(companyId) },
    ];

    let completed = 0;
    for (const task of tasks) {
      await this.provisioningJobRepository.update({ jobId }, {
        currentTask: task.name,
        completedTasks: completed,
      });

      await task.execute();
      completed++;
    }
  }

  private async createCompany(companyId: string, data: ProvisioningData): Promise<void> {
    const companyCode = this.generateCompanyCode(data.companyName);
    const slug = this.generateSlug(data.companyName);

    const trialDays = data.trialDays || 14;
    const trialStartsAt = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const company = this.companyRepository.create({
      id: companyId,
      companyCode,
      legalName: data.legalName || data.companyName,
      displayName: data.companyName,
      slug,
      email: data.email,
      phone: data.phone,
      country: data.country || 'India',
      industry: data.industry,
      status: CompanyStatus.ONBOARDING,
      subscriptionStatus: SubscriptionStatus.TRIALING,
      trialStartsAt,
      trialEndsAt,
      isOnboarded: false,
    });

    await this.companyRepository.save(company);
  }

  private async createBranding(companyId: string, data: ProvisioningData): Promise<void> {
    const branding = this.brandingRepository.create({
      companyId,
      primaryColor: '#2563EB',
      secondaryColor: '#64748B',
      successColor: '#22C55E',
      warningColor: '#F59E0B',
      dangerColor: '#EF4444',
      showPlatformBranding: true,
      showPoweredBy: true,
    });

    await this.brandingRepository.save(branding);
  }

  private async createSettings(companyId: string, data: ProvisioningData): Promise<void> {
    const settings = this.settingsRepository.create({
      companyId,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      locale: 'en-IN',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'hh:mm A',
      emailNotificationsEnabled: true,
      emailReminderEnabled: true,
      emailReminderDays: 3,
      defaultGstPercent: 18,
      taskSlaHours: 24,
      sessionTimeoutMinutes: 90,
      maxLoginAttempts: 5,
      auditLogRetentionDays: 365,
      sessionRetentionDays: 90,
    });

    await this.settingsRepository.save(settings);
  }

  private async createContacts(companyId: string, data: ProvisioningData): Promise<void> {
    const contact = this.contactRepository.create({
      companyId,
      contactType: ContactType.PRIMARY,
      name: data.adminName,
      email: data.email,
      phone: data.phone,
      isPrimary: true,
    });

    await this.contactRepository.save(contact);
  }

  private async createSubscription(companyId: string, data: ProvisioningData): Promise<void> {
    let plan = await this.planRepository.findOne({ where: { planCode: data.planCode || 'starter' } });
    
    if (!plan) {
      plan = await this.planRepository.findOne({ where: { planCode: 'starter' } });
    }

    const trialDays = data.trialDays || plan?.trialDays || 14;
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + trialDays);

    const subscription = this.subscriptionRepository.create({
      companyId,
      planId: plan?.id,
      status: 'trialing',
      trialStart,
      trialEnd,
      trialConverted: false,
      autoRenew: true,
    });

    await this.subscriptionRepository.save(subscription);

    // Update company with trial info
    await this.companyRepository.update(companyId, {
      currentPlanId: plan?.id,
      trialStartsAt: trialStart,
      trialEndsAt: trialEnd,
    });
  }

  private async createDefaultRoles(companyId: string): Promise<void> {
    // Default roles are created by init-scripts
    // This is for company-specific role customizations if needed
    // For now, we use platform-level roles
  }

  private async createAdminUser(companyId: string, data: ProvisioningData): Promise<void> {
    // Admin user creation is handled by Auth module after tenant provisioning
    // Store admin data in metadata for auth module to use
  }

  private async seedNumberSeries(companyId: string): Promise<void> {
    // Number series seeding is handled by init-scripts
    // Company-specific customization can be added here
  }

  private async seedMasters(companyId: string): Promise<void> {
    // Master data seeding is handled by init-scripts
    // Company-specific master data can be added here
  }

  private async createOnboardingChecklist(companyId: string): Promise<void> {
    const checklistItems = [
      { stepNumber: 1, title: 'Complete Company Profile', description: 'Add your company details', category: 'profile', stepUrl: '/settings/profile', sortOrder: 1, isRequired: true },
      { stepNumber: 2, title: 'Upload Company Logo', description: 'Add your company logo for branding', category: 'branding', stepUrl: '/settings/branding', sortOrder: 2, isRequired: false },
      { stepNumber: 3, title: 'Add Team Members', description: 'Invite your team to join', category: 'users', stepUrl: '/settings/users', sortOrder: 3, isRequired: false },
      { stepNumber: 4, title: 'Add Product Categories', description: 'Set up your product catalog', category: 'masters', stepUrl: '/masters/categories', sortOrder: 4, isRequired: true },
      { stepNumber: 5, title: 'Add Products', description: 'Add your first products', category: 'masters', stepUrl: '/masters/products', sortOrder: 5, isRequired: true },
      { stepNumber: 6, title: 'Add Customers', description: 'Add your customer list', category: 'masters', stepUrl: '/masters/customers', sortOrder: 6, isRequired: false },
      { stepNumber: 7, title: 'Add Vendors', description: 'Add your vendor list', category: 'masters', stepUrl: '/masters/vendors', sortOrder: 7, isRequired: false },
      { stepNumber: 8, title: 'Create First Enquiry', description: 'Create your first sales enquiry', category: 'sales', stepUrl: '/sales/enquiries/new', sortOrder: 8, isRequired: false },
    ];

    for (const item of checklistItems) {
      const checklist = this.onboardingRepository.create({
        companyId,
        ...item,
        isCompleted: false,
      });

      await this.onboardingRepository.save(checklist);
    }
  }

  private generateCompanyCode(name: string): string {
    const prefix = name.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6);
  }

  async getProvisioningStatus(jobId: string): Promise<ProvisioningJob | null> {
    return this.provisioningJobRepository.findOne({ where: { jobId } });
  }

  async getOnboardingChecklist(companyId: string): Promise<OnboardingChecklist[]> {
    return this.onboardingRepository.find({
      where: { companyId },
      order: { sortOrder: 'ASC' },
    });
  }

  async completeOnboardingStep(companyId: string, stepNumber: number, userId: string): Promise<void> {
    await this.onboardingRepository.update(
      { companyId, stepNumber },
      { isCompleted: true, completedAt: new Date(), completedBy: userId }
    );

    // Check if all required steps are complete
    const remaining = await this.onboardingRepository.count({
      where: { companyId, isCompleted: false, isRequired: true },
    });

    if (remaining === 0) {
      await this.companyRepository.update(companyId, {
        isOnboarded: true,
        onboardedAt: new Date(),
        status: CompanyStatus.ACTIVE,
      });
    }
  }
}
