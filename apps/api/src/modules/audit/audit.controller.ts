import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { StatusHistory } from './entities/status-history.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all audit logs with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'module', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'changedBy', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('changedBy') changedBy?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const whereConditions: any = {};

    if (module) whereConditions.moduleName = module;
    if (action) whereConditions.action = action;
    if (changedBy) whereConditions.changedBy = changedBy;
    if (startDate && endDate) {
      whereConditions.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereConditions.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereConditions.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const [data, total] = await this.auditLogRepo.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip,
      take: limitNum,
    });

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get('trail/:module/:recordId')
  @ApiOperation({ summary: 'Get audit trail for a specific record' })
  getAuditTrail(
    @Param('module') module: string,
    @Param('recordId') recordId: string,
  ) {
    return this.auditService.getAuditTrail(module, recordId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserActivity(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getUserActivity(userId, limit ? Number(limit) : 50);
  }

  @Get('status-history/:module/:recordId')
  @ApiOperation({ summary: 'Get status history for a record' })
  getStatusHistory(
    @Param('module') module: string,
    @Param('recordId') recordId: string,
  ) {
    return this.auditService.getStatusHistory(module, recordId);
  }
}
