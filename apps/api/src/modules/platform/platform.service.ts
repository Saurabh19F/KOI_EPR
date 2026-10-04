import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Company, CompanyStatus, SubscriptionStatus } from './entities/company.entity';
import { CompanyBranding } from './entities/company-branding.entity';
import { CompanyDomain } from './entities/company-domain.entity';
import { CompanySettings } from './entities/company-settings.entity';
import { CompanyContact } from './entities/company-contact.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Subscription } from './entities/subscription.entity';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(CompanyBranding)
    private brandingRepository: Repository<CompanyBranding>,
    @InjectRepository(CompanyDomain)
    private domainRepository: Repository<CompanyDomain>,
    @InjectRepository(CompanySettings)
    private settingsRepository: Repository<CompanySettings>,
    @InjectRepository(CompanyContact)
    private contactRepository: Repository<CompanyContact>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  // Company Methods
  async createCompany(dto: CreateCompanyDto): Promise<Company> {
    const existingCompany = await this.companyRepository.findOne({
      where: [
        { email: dto.email },
        { companyCode: dto.companyCode },
        { slug: dto.slug },
      ],
    });

    if (existingCompany) {
      throw new BadRequestException('Company with this email, code, or slug already exists');
    }

    const company = this.companyRepository.create({
      ...dto,
      status: CompanyStatus.PENDING,
      subscriptionStatus: SubscriptionStatus.TRIALING,
    });

    return this.companyRepository.save(company);
  }

  async findAllCompanies(page = 1, limit = 20, search?: string, status?: string): Promise<{ data: Company[]; total: number }> {
    const query = this.companyRepository.createQueryBuilder('company')
      .where('company.deletedAt IS NULL');

    if (search) {
      query.andWhere(
        '(company.name ILIKE :search OR company.email ILIKE :search OR company.companyCode ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      query.andWhere('company.status = :status', { status });
    }

    const [data, total] = await query
      .orderBy('company.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findCompanyById(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async findCompanyBySlug(slug: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { slug, deletedAt: IsNull() },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findCompanyById(id);
    
    Object.assign(company, dto);
    return this.companyRepository.save(company);
  }

  async suspendCompany(id: string): Promise<Company> {
    const company = await this.findCompanyById(id);
    company.status = CompanyStatus.SUSPENDED;
    company.subscriptionStatus = SubscriptionStatus.SUSPENDED;
    return this.companyRepository.save(company);
  }

  async activateCompany(id: string): Promise<Company> {
    const company = await this.findCompanyById(id);
    company.status = CompanyStatus.ACTIVE;
    return this.companyRepository.save(company);
  }

  async deleteCompany(id: string, deletedBy: string): Promise<void> {
    const company = await this.findCompanyById(id);
    company.deletedAt = new Date();
    company.deletedBy = deletedBy;
    await this.companyRepository.save(company);
  }

  // Company Branding Methods
  async createOrUpdateBranding(companyId: string, brandingData: Partial<CompanyBranding>): Promise<CompanyBranding> {
    let branding = await this.brandingRepository.findOne({ where: { companyId } });
    
    if (branding) {
      Object.assign(branding, brandingData);
    } else {
      branding = this.brandingRepository.create({
        companyId,
        ...brandingData,
      });
    }

    return this.brandingRepository.save(branding);
  }

  async getBranding(companyId: string): Promise<CompanyBranding | null> {
    return this.brandingRepository.findOne({ where: { companyId } });
  }

  // Company Settings Methods
  async createOrUpdateSettings(companyId: string, settingsData: Partial<CompanySettings>): Promise<CompanySettings> {
    let settings = await this.settingsRepository.findOne({ where: { companyId } });
    
    if (settings) {
      Object.assign(settings, settingsData);
    } else {
      settings = this.settingsRepository.create({
        companyId,
        ...settingsData,
      });
    }

    return this.settingsRepository.save(settings);
  }

  async getSettings(companyId: string): Promise<CompanySettings | null> {
    return this.settingsRepository.findOne({ where: { companyId } });
  }

  // Company Domains Methods
  async addDomain(companyId: string, domain: string, type: string = 'custom'): Promise<CompanyDomain> {
    const domainEntity = this.domainRepository.create({
      companyId,
      domain,
      domainType: type as any,
    });

    return this.domainRepository.save(domainEntity);
  }

  async getDomains(companyId: string): Promise<CompanyDomain[]> {
    return this.domainRepository.find({ where: { companyId } });
  }

  // Company Contacts Methods
  async addContact(companyId: string, contactData: Partial<CompanyContact>): Promise<CompanyContact> {
    const contact = this.contactRepository.create({
      companyId,
      ...contactData,
    });

    return this.contactRepository.save(contact);
  }

  async getContacts(companyId: string): Promise<CompanyContact[]> {
    return this.contactRepository.find({ where: { companyId } });
  }

  // Subscription Plan Methods
  async getAllPlans(includeInactive = false): Promise<SubscriptionPlan[]> {
    const query = this.planRepository.createQueryBuilder('plan')
      .where('plan.isPublic = :isPublic', { isPublic: true });

    if (!includeInactive) {
      query.andWhere('plan.isActive = :isActive', { isActive: true });
    }

    return query.orderBy('plan.sortOrder', 'ASC').getMany();
  }

  async getPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async getPlanByCode(code: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { planCode: code } });
    
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  // Subscription Methods
  async getCompanySubscription(companyId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { companyId },
      relations: ['plan'],
    });
  }

  // Trial Check
  async isTrialExpired(companyId: string): Promise<boolean> {
    const company = await this.findCompanyById(companyId);
    
    if (company.subscriptionStatus !== SubscriptionStatus.TRIALING) {
      return false;
    }

    if (!company.trialEndsAt) {
      return false;
    }

    return new Date() > company.trialEndsAt;
  }

  // Check if company is active and can access the system
  async canAccessCompany(companyId: string): Promise<{ canAccess: boolean; reason?: string }> {
    const company = await this.findCompanyById(companyId);

    if (company.status === CompanyStatus.SUSPENDED) {
      return { canAccess: false, reason: 'Company is suspended' };
    }

    if (company.status === CompanyStatus.CANCELLED) {
      return { canAccess: false, reason: 'Company is cancelled' };
    }

    if (company.subscriptionStatus === SubscriptionStatus.EXPIRED) {
      return { canAccess: false, reason: 'Subscription expired' };
    }

    if (company.subscriptionStatus === SubscriptionStatus.TRIALING) {
      const isExpired = await this.isTrialExpired(companyId);
      if (isExpired) {
        return { canAccess: false, reason: 'Trial expired' };
      }
    }

    return { canAccess: true };
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalCompanies: number;
    activeCompanies: number;
    trialCompanies: number;
    suspendedCompanies: number;
    planDistribution: { plan: string; count: number }[];
  }> {
    const totalCompanies = await this.companyRepository.count({ where: { deletedAt: IsNull() } });
    const activeCompanies = await this.companyRepository.count({ 
      where: { status: CompanyStatus.ACTIVE, deletedAt: IsNull() } 
    });
    const trialCompanies = await this.companyRepository.count({ 
      where: { subscriptionStatus: SubscriptionStatus.TRIALING, deletedAt: IsNull() } 
    });
    const suspendedCompanies = await this.companyRepository.count({ 
      where: { status: CompanyStatus.SUSPENDED, deletedAt: IsNull() } 
    });

    const planDistribution = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select('sub.planId', 'plan')
      .addSelect('COUNT(*)', 'count')
      .where('sub.status = :status', { status: 'active' })
      .groupBy('sub.planId')
      .getRawMany();

    return {
      totalCompanies,
      activeCompanies,
      trialCompanies,
      suspendedCompanies,
      planDistribution,
    };
  }
}
