import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ApprovalMatrix } from './entities/approval-matrix.entity';
import { NumberSeries } from './entities/number-series.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { HelpTicket } from './entities/help-ticket.entity';
import { Department } from '../users/entities/department.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(ApprovalMatrix)
    private approvalMatrixRepo: Repository<ApprovalMatrix>,
    @InjectRepository(NumberSeries)
    private numberSeriesRepo: Repository<NumberSeries>,
    @InjectRepository(EmailTemplate)
    private emailTemplateRepo: Repository<EmailTemplate>,
    @InjectRepository(SystemSetting)
    private systemSettingRepo: Repository<SystemSetting>,
    @InjectRepository(HelpTicket)
    private helpTicketRepo: Repository<HelpTicket>,
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
  ) {}

  private getCompanyId(user: any, requestedCompanyId?: string): string | null {
    return user?.isSuperAdmin ? (requestedCompanyId || null) : (user?.companyId || null);
  }

  private slug(value: string | undefined, fallback: string): string {
    const slug = (value || fallback)
      .toString()
      .trim()
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
    return slug || fallback.toUpperCase();
  }

  private mapNumberSeries(series: NumberSeries) {
    return {
      ...series,
      id: series.numberSeriesId,
      module: series.moduleName,
      suffix: '',
      startingNumber: 1,
      description: series.format || '',
    };
  }

  private mapEmailTemplate(template: EmailTemplate) {
    return {
      ...template,
      id: template.id,
      module: template.triggerEvent || template.code,
    };
  }

  private mapDepartment(department: Department) {
    return {
      ...department,
      id: department.departmentId,
      code: department.departmentCode,
      name: department.departmentName,
      managerId: department.headUserId,
      members: 0,
    };
  }

  // ====================
  // Number Series
  // ====================
  async listNumberSeries(user?: any, companyId?: string) {
    const effectiveCompanyId = this.getCompanyId(user, companyId);
    const where = effectiveCompanyId
      ? [{ companyId: effectiveCompanyId, isActive: true }, { companyId: IsNull() as any, isActive: true }]
      : [{ companyId: IsNull() as any, isActive: true }];
    const data = await this.numberSeriesRepo.find({ where, order: { moduleName: 'ASC' } });
    return data.map(series => this.mapNumberSeries(series));
  }

  async getNumberSeriesById(id: string, user?: any): Promise<NumberSeries> {
    const series = await this.numberSeriesRepo.findOne({ where: { numberSeriesId: id } });
    if (!series) throw new NotFoundException('Number series not found');
    const companyId = this.getCompanyId(user);
    if (companyId && series.companyId && series.companyId !== companyId) {
      throw new NotFoundException('Number series not found');
    }
    return series;
  }

  async createNumberSeries(data: any, user?: any) {
    const moduleName = data.moduleName || data.module || 'custom';
    const series = this.numberSeriesRepo.create({
      companyId: this.getCompanyId(user, data.companyId),
      moduleName,
      prefix: data.prefix || this.slug(moduleName, 'NUM').slice(0, 6),
      currentNumber: Number(data.currentNumber ?? data.startingNumber ?? 0),
      padding: Number(data.padding || 6),
      format: data.format || data.description || null,
      userCode: data.userCode || null,
      year: data.year ? Number(data.year) : new Date().getFullYear(),
      isActive: data.isActive ?? true,
      createdBy: user?.userId,
    });
    return this.mapNumberSeries(await this.numberSeriesRepo.save(series));
  }

  async updateNumberSeries(id: string, data: any, user?: any) {
    const series = await this.getNumberSeriesById(id, user);
    if (data.module !== undefined || data.moduleName !== undefined) series.moduleName = data.moduleName || data.module;
    if (data.prefix !== undefined) series.prefix = data.prefix;
    if (data.currentNumber !== undefined || data.startingNumber !== undefined) {
      series.currentNumber = Number(data.currentNumber ?? data.startingNumber);
    }
    if (data.padding !== undefined) series.padding = Number(data.padding);
    if (data.format !== undefined || data.description !== undefined) series.format = data.format || data.description || null;
    if (data.userCode !== undefined) series.userCode = data.userCode || null;
    if (data.year !== undefined) series.year = data.year ? Number(data.year) : null;
    if (data.isActive !== undefined) series.isActive = data.isActive;
    series.updatedBy = user?.userId;
    return this.mapNumberSeries(await this.numberSeriesRepo.save(series));
  }

  async deleteNumberSeries(id: string, user?: any) {
    const series = await this.getNumberSeriesById(id, user);
    series.isActive = false;
    series.updatedBy = user?.userId;
    await this.numberSeriesRepo.save(series);
    return { deleted: true };
  }

  async resetNumberSeries(id: string, user?: any) {
    const series = await this.getNumberSeriesById(id, user);
    series.currentNumber = 0;
    series.updatedBy = user?.userId;
    return this.mapNumberSeries(await this.numberSeriesRepo.save(series));
  }

  async getNextNumber(companyId: string, module: string): Promise<string> {
    const series = await this.numberSeriesRepo.findOne({
      where: { companyId, moduleName: module, isActive: true },
    });

    if (!series) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `${module}-${year}-${random}`;
    }

    const currentYear = new Date().getFullYear();
    const prefix = series.prefix || module;
    const userCode = series.userCode || '';
    const padding = series.padding || 4;
    const currentNum = series.currentNumber || 0;
    const newNumber = (currentNum + 1).toString().padStart(padding, '0');

    series.currentNumber = parseInt(newNumber);
    await this.numberSeriesRepo.save(series);

    if (userCode) {
      return `${prefix}-${userCode}-${currentYear}-${newNumber}`;
    }
    return `${prefix}-${currentYear}-${newNumber}`;
  }

  // ====================
  // System Settings
  // ====================
  async getSetting(companyId: string, key: string): Promise<string | undefined> {
    const setting = await this.systemSettingRepo.findOne({
      where: { companyId, key, isActive: true },
    });
    return setting?.value;
  }

  async setSetting(companyId: string, key: string, value: string): Promise<void> {
    const setting = await this.systemSettingRepo.findOne({
      where: { companyId, key },
    });

    if (setting) {
      setting.value = value;
      await this.systemSettingRepo.save(setting);
    } else {
      const newSetting = this.systemSettingRepo.create({
        companyId,
        key,
        value,
        isActive: true,
      });
      await this.systemSettingRepo.save(newSetting);
    }
  }

  // ====================
  // Approval Matrix
  // ====================
  async getApprovalChain(companyId: string, module: string, amount: number): Promise<ApprovalMatrix[]> {
    return this.approvalMatrixRepo.find({
      where: { companyId, moduleName: module, isActive: true },
      order: { approvalLevel: 'ASC' },
    });
  }

  // ====================
  // Email Templates
  // ====================
  async listEmailTemplates(user?: any, companyId?: string) {
    const effectiveCompanyId = this.getCompanyId(user, companyId);
    const where = effectiveCompanyId
      ? [{ companyId: effectiveCompanyId, isActive: true }, { companyId: IsNull() as any, isActive: true }]
      : [{ companyId: IsNull() as any, isActive: true }];
    const data = await this.emailTemplateRepo.find({ where, order: { name: 'ASC' } });
    return data.map(template => this.mapEmailTemplate(template));
  }

  async getEmailTemplateById(id: string, user?: any) {
    const template = await this.emailTemplateRepo.findOne({ where: { id, isActive: true } });
    if (!template) throw new NotFoundException('Email template not found');
    const companyId = this.getCompanyId(user);
    if (companyId && template.companyId && template.companyId !== companyId) {
      throw new NotFoundException('Email template not found');
    }
    return this.mapEmailTemplate(template);
  }

  async getEmailTemplate(companyId: string, templateCode: string): Promise<EmailTemplate | null> {
    return this.emailTemplateRepo.findOne({
      where: { companyId, code: templateCode, isActive: true },
    });
  }

  async createEmailTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const template = this.emailTemplateRepo.create(data);
    return this.emailTemplateRepo.save(template);
  }

  async createEmailTemplateConfig(data: any, user?: any) {
    const name = data.name || 'Email Template';
    const moduleName = data.module || data.triggerEvent || name;
    const template = this.emailTemplateRepo.create({
      companyId: this.getCompanyId(user, data.companyId),
      code: data.code || this.slug(`${moduleName}_${name}`, 'EMAIL_TEMPLATE'),
      name,
      subject: data.subject || '',
      body: data.body || '',
      channel: data.channel || 'email',
      triggerEvent: moduleName,
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? false,
    });
    return this.mapEmailTemplate(await this.emailTemplateRepo.save(template));
  }

  async updateEmailTemplate(id: string, data: any, user?: any) {
    const existing = await this.emailTemplateRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Email template not found');
    const companyId = this.getCompanyId(user);
    if (companyId && existing.companyId && existing.companyId !== companyId) {
      throw new NotFoundException('Email template not found');
    }
    if (data.name !== undefined) existing.name = data.name;
    if (data.subject !== undefined) existing.subject = data.subject;
    if (data.body !== undefined) existing.body = data.body;
    if (data.module !== undefined || data.triggerEvent !== undefined) existing.triggerEvent = data.triggerEvent || data.module;
    if (data.code !== undefined) existing.code = data.code;
    if (data.channel !== undefined) existing.channel = data.channel;
    if (data.isActive !== undefined) existing.isActive = data.isActive;
    if (data.isDefault !== undefined) existing.isDefault = data.isDefault;
    return this.mapEmailTemplate(await this.emailTemplateRepo.save(existing));
  }

  async deleteEmailTemplate(id: string, user?: any) {
    const template = await this.emailTemplateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Email template not found');
    const companyId = this.getCompanyId(user);
    if (companyId && template.companyId && template.companyId !== companyId) {
      throw new NotFoundException('Email template not found');
    }
    template.isActive = false;
    await this.emailTemplateRepo.save(template);
    return { deleted: true };
  }

  async testEmailTemplate(id: string, body: any, user?: any) {
    await this.getEmailTemplateById(id, user);
    return { sent: true, recipient: body?.email || body?.recipient || null };
  }

  // ====================
  // Departments
  // ====================
  async listDepartments(user?: any, companyId?: string) {
    const effectiveCompanyId = this.getCompanyId(user, companyId);
    const where = effectiveCompanyId
      ? [{ companyId: effectiveCompanyId, isActive: true }, { companyId: IsNull() as any, isActive: true }]
      : [{ companyId: IsNull() as any, isActive: true }];
    const data = await this.departmentRepo.find({ where, order: { departmentName: 'ASC' } });
    return data.map(department => this.mapDepartment(department));
  }

  async getDepartmentById(id: string, user?: any) {
    const department = await this.departmentRepo.findOne({ where: { departmentId: id, isActive: true } });
    if (!department) throw new NotFoundException('Department not found');
    const companyId = this.getCompanyId(user);
    if (companyId && department.companyId && department.companyId !== companyId) {
      throw new NotFoundException('Department not found');
    }
    return this.mapDepartment(department);
  }

  async createDepartment(data: any, user?: any) {
    const name = data.departmentName || data.name || 'Department';
    const department = this.departmentRepo.create({
      companyId: this.getCompanyId(user, data.companyId),
      departmentName: name,
      departmentCode: data.departmentCode || data.code || this.slug(name, 'DEPT').slice(0, 12),
      headUserId: data.headUserId || data.managerId || null,
      description: data.description || null,
      isActive: data.isActive ?? true,
    });
    return this.mapDepartment(await this.departmentRepo.save(department));
  }

  async updateDepartment(id: string, data: any, user?: any) {
    const department = await this.departmentRepo.findOne({ where: { departmentId: id } });
    if (!department) throw new NotFoundException('Department not found');
    const companyId = this.getCompanyId(user);
    if (companyId && department.companyId && department.companyId !== companyId) {
      throw new NotFoundException('Department not found');
    }
    if (data.departmentName !== undefined || data.name !== undefined) department.departmentName = data.departmentName || data.name;
    if (data.departmentCode !== undefined || data.code !== undefined) department.departmentCode = data.departmentCode || data.code;
    if (data.headUserId !== undefined || data.managerId !== undefined) department.headUserId = data.headUserId || data.managerId || null;
    if (data.description !== undefined) department.description = data.description || null;
    if (data.isActive !== undefined) department.isActive = data.isActive;
    return this.mapDepartment(await this.departmentRepo.save(department));
  }

  async deleteDepartment(id: string, user?: any) {
    const department = await this.departmentRepo.findOne({ where: { departmentId: id } });
    if (!department) throw new NotFoundException('Department not found');
    const companyId = this.getCompanyId(user);
    if (companyId && department.companyId && department.companyId !== companyId) {
      throw new NotFoundException('Department not found');
    }
    department.isActive = false;
    await this.departmentRepo.save(department);
    return { deleted: true };
  }

  async getDepartmentUsers(id: string, user?: any) {
    await this.getDepartmentById(id, user);
    return [];
  }

  // ====================
  // Help Tickets
  // ====================
  async createHelpTicket(data: Partial<HelpTicket>): Promise<HelpTicket> {
    const ticket = this.helpTicketRepo.create({
      ...data,
      ticketNumber: data.ticketNumber || `TKT-${Date.now()}`,
    });
    return this.helpTicketRepo.save(ticket);
  }

  async getHelpTickets(companyId: string): Promise<HelpTicket[]> {
    return this.helpTicketRepo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }
}
