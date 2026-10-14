import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QualityService } from './quality.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  CreateQualityLogDto,
  UpdateQualityLogDto,
  CreateRejectActionLogDto,
  UpdateRejectActionLogDto,
} from './dto/quality.dto';
import { QualityLogStatus } from './entities/quality.entity';
import { RejectActionStatus } from './entities/quality.entity';

@ApiTags('quality')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  // ========== QUALITY INSPECTIONS ==========

  @Post('inspections')
  @Permissions('QUALITY_CREATE')
  @ApiOperation({ summary: 'Create a quality inspection log' })
  createInspection(
    @Body() dto: CreateQualityLogDto,
    @CurrentUser() user: any,
  ) {
    return this.qualityService.createQualityLog(dto, user?.userId, user?.companyId);
  }

  @Get('inspections')
  @Permissions('QUALITY_VIEW')
  @ApiOperation({ summary: 'Get all quality inspections (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: QualityLogStatus })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  findAllInspections(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: QualityLogStatus,
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.qualityService.findAllQualityLogs({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
      warehouseId,
      productId,
      companyId: user?.companyId,
    });
  }

  @Get('inspections/:id')
  @Permissions('QUALITY_VIEW')
  @ApiOperation({ summary: 'Get quality inspection by ID' })
  findInspection(@Param('id') id: string) {
    return this.qualityService.findQualityLogById(id);
  }

  @Patch('inspections/:id')
  @Permissions('QUALITY_EDIT')
  @ApiOperation({ summary: 'Update inspection results' })
  updateInspection(
    @Param('id') id: string,
    @Body() dto: UpdateQualityLogDto,
    @CurrentUser() user: any,
  ) {
    return this.qualityService.updateInspection(id, dto, user?.userId);
  }

  @Patch('inspections/:id/complete')
  @Permissions('QUALITY_EDIT')
  @ApiOperation({ summary: 'Mark inspection as completed' })
  completeInspection(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.qualityService.completeInspection(id, user?.userId);
  }

  @Delete('inspections/:id')
  @Permissions('QUALITY_DELETE')
  @ApiOperation({ summary: 'Cancel a quality inspection' })
  cancelInspection(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.qualityService.cancelQualityLog(id, user?.userId);
  }

  // ========== REJECT ACTIONS ==========

  @Post('reject-actions')
  @Permissions('REJECT_ACTION_CREATE')
  @ApiOperation({ summary: 'Create a reject action' })
  createRejectAction(
    @Body() dto: CreateRejectActionLogDto,
    @CurrentUser() user: any,
  ) {
    return this.qualityService.createRejectAction(dto, user?.userId, user?.companyId);
  }

  @Get('reject-actions')
  @Permissions('REJECT_ACTION_VIEW')
  @ApiOperation({ summary: 'Get all reject actions (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: RejectActionStatus })
  @ApiQuery({ name: 'actionType', required: false })
  findAllRejectActions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: RejectActionStatus,
    @Query('actionType') actionType?: string,
    @CurrentUser() user?: any,
  ) {
    return this.qualityService.findAllRejectActions({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
      actionType,
      companyId: user?.companyId,
    });
  }

  @Get('reject-actions/:id')
  @Permissions('REJECT_ACTION_VIEW')
  @ApiOperation({ summary: 'Get reject action by ID' })
  findRejectAction(@Param('id') id: string) {
    return this.qualityService.findRejectActionById(id);
  }

  @Patch('reject-actions/:id')
  @Permissions('REJECT_ACTION_EDIT')
  @ApiOperation({ summary: 'Update a reject action' })
  updateRejectAction(
    @Param('id') id: string,
    @Body() dto: UpdateRejectActionLogDto,
    @CurrentUser() user: any,
  ) {
    return this.qualityService.updateRejectAction(id, dto, user?.userId);
  }

  @Patch('reject-actions/:id/replacement-received')
  @Permissions('REJECT_ACTION_EDIT')
  @ApiOperation({ summary: 'Mark replacement as received' })
  markReplacementReceived(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.qualityService.markReplacementReceived(id, user?.userId);
  }
}
