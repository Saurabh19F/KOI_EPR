import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { ProvisioningService } from './provisioning.service';
import { FeatureService } from './feature.service';
import { SubscriptionService } from './subscription.service';
import { UsageService } from './usage.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyBrandingDto,
  CompanySettingsDto,
  CompanyDomainDto,
  CompanyContactDto,
  SignupDto,
} from './dto/company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Platform')
@Controller('platform')
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly provisioningService: ProvisioningService,
    private readonly featureService: FeatureService,
    private readonly subscriptionService: SubscriptionService,
    private readonly usageService: UsageService,
  ) {}

  // ==================== PUBLIC ROUTES ====================

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign up a new company (Public)' })
  @ApiResponse({ status: 201, description: 'Company signed up successfully' })
  async signup(@Body() dto: SignupDto) {
    return this.provisioningService.provisionTenant({
      companyName: dto.companyName,
      email: dto.email,
      phone: dto.phone,
      adminEmail: dto.email,
      adminPassword: dto.password,
      adminName: dto.adminName,
      industry: dto.industry,
      country: dto.country,
      planCode: dto.planCode,
    });
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans (Public)' })
  @ApiResponse({ status: 200, description: 'List of plans' })
  async getPlans() {
    return this.platformService.getAllPlans();
  }

  @Get('features')
  @ApiOperation({ summary: 'Get all features (Public)' })
  @ApiResponse({ status: 200, description: 'List of features' })
  async getFeatures() {
    return this.featureService.getAllFeatures();
  }

  @Get('branding/:slug')
  @ApiOperation({ summary: 'Get company branding by slug (Public)' })
  @ApiResponse({ status: 200, description: 'Company branding' })
  async getBrandingBySlug(@Param('slug') slug: string) {
    return this.platformService.findCompanyBySlug(slug).then(company => 
      this.platformService.getBranding(company.id)
    );
  }

  // ==================== PROTECTED ROUTES ====================

  @Get('companies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all companies (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of companies' })
  async getCompanies(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.platformService.findAllCompanies(+page, +limit, search, status);
  }

  @Get('companies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Company details' })
  async getCompany(@Param('id') id: string) {
    return this.platformService.findCompanyById(id);
  }

  @Put('companies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update company (Admin only)' })
  @ApiResponse({ status: 200, description: 'Company updated' })
  async updateCompany(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.platformService.updateCompany(id, dto);
  }

  @Patch('companies/:id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend company (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Company suspended' })
  async suspendCompany(@Param('id') id: string) {
    return this.platformService.suspendCompany(id);
  }

  @Patch('companies/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate company (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Company activated' })
  async activateCompany(@Param('id') id: string) {
    return this.platformService.activateCompany(id);
  }

  @Delete('companies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company (Super Admin only)' })
  @ApiResponse({ status: 204, description: 'Company deleted' })
  async deleteCompany(@Param('id') id: string, @Request() req) {
    await this.platformService.deleteCompany(id, req.user.id);
  }

  // ==================== BRANDING ====================

  @Get('branding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current company branding' })
  @ApiResponse({ status: 200, description: 'Company branding' })
  async getMyBranding(@Request() req) {
    return this.platformService.getBranding(req.user.companyId);
  }

  @Put('branding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current company branding' })
  @ApiResponse({ status: 200, description: 'Branding updated' })
  async updateBranding(
    @Request() req,
    @Body() dto: CompanyBrandingDto,
  ) {
    return this.platformService.createOrUpdateBranding(req.user.companyId, dto);
  }

  // ==================== SETTINGS ====================

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current company settings' })
  @ApiResponse({ status: 200, description: 'Company settings' })
  async getMySettings(@Request() req) {
    return this.platformService.getSettings(req.user.companyId);
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current company settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @Request() req,
    @Body() dto: CompanySettingsDto,
  ) {
    return this.platformService.createOrUpdateSettings(req.user.companyId, dto);
  }

  // ==================== DOMAINS ====================

  @Get('domains')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company domains' })
  @ApiResponse({ status: 200, description: 'Company domains' })
  async getDomains(@Request() req) {
    return this.platformService.getDomains(req.user.companyId);
  }

  @Post('domains')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add company domain' })
  @ApiResponse({ status: 201, description: 'Domain added' })
  async addDomain(@Request() req, @Body() dto: CompanyDomainDto) {
    return this.platformService.addDomain(req.user.companyId, dto.domain, dto.domainType);
  }

  // ==================== CONTACTS ====================

  @Get('contacts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company contacts' })
  @ApiResponse({ status: 200, description: 'Company contacts' })
  async getContacts(@Request() req) {
    return this.platformService.getContacts(req.user.companyId);
  }

  @Post('contacts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add company contact' })
  @ApiResponse({ status: 201, description: 'Contact added' })
  async addContact(@Request() req, @Body() dto: CompanyContactDto) {
    return this.platformService.addContact(req.user.companyId, dto);
  }

  // ==================== SUBSCRIPTION ====================

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current company subscription' })
  @ApiResponse({ status: 200, description: 'Company subscription' })
  async getMySubscription(@Request() req) {
    return this.platformService.getCompanySubscription(req.user.companyId);
  }

  @Post('subscription/extend-trial')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extend trial (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Trial extended' })
  async extendTrial(
    @Request() req,
    @Body('companyId') companyId: string,
    @Body('days') days: number,
  ) {
    return this.subscriptionService.extendTrial(companyId, days, undefined, req.user.id);
  }

  @Post('subscription/upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upgrade subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan upgraded' })
  async upgradePlan(@Request() req, @Body('planId') planId: string) {
    return this.subscriptionService.upgradePlan(req.user.companyId, planId);
  }

  // ==================== USAGE ====================

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current company usage' })
  @ApiResponse({ status: 200, description: 'Company usage' })
  async getMyUsage(@Request() req) {
    return this.usageService.getUsageSummary(req.user.companyId);
  }

  @Get('usage/limits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check usage limits' })
  @ApiResponse({ status: 200, description: 'Usage limits status' })
  async checkLimits(@Request() req) {
    return this.usageService.checkLimits(req.user.companyId);
  }

  // ==================== ONBOARDING ====================

  @Get('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get onboarding checklist' })
  @ApiResponse({ status: 200, description: 'Onboarding checklist' })
  async getOnboarding(@Request() req) {
    return this.provisioningService.getOnboardingChecklist(req.user.companyId);
  }

  @Post('onboarding/:stepNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete onboarding step' })
  @ApiResponse({ status: 200, description: 'Step completed' })
  async completeOnboardingStep(@Request() req, @Param('stepNumber') stepNumber: number) {
    await this.provisioningService.completeOnboardingStep(req.user.companyId, +stepNumber, req.user.id);
    return { success: true };
  }

  // ==================== ADMIN DASHBOARD ====================

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform dashboard stats (Admin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async getDashboard() {
    return this.platformService.getDashboardStats();
  }

  @Get('admin/subscription-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription stats (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription stats' })
  async getSubscriptionStats() {
    return this.subscriptionService.getSubscriptionStats();
  }

  @Get('admin/platform-usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform-wide usage stats (Admin only)' })
  @ApiResponse({ status: 200, description: 'Platform usage' })
  async getPlatformUsage() {
    return this.usageService.getPlatformUsage();
  }

  @Get('admin/provisioning/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get provisioning job status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Provisioning status' })
  async getProvisioningStatus(@Param('jobId') jobId: string) {
    return this.provisioningService.getProvisioningStatus(jobId);
  }
}
