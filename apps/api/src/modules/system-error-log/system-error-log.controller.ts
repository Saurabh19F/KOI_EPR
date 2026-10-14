import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SystemErrorLogService } from './system-error-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateSystemErrorLogDto } from './dto/system-error-log.dto';

@ApiTags('system-error-log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('system-error-logs')
export class SystemErrorLogController {
  constructor(private readonly errorLogService: SystemErrorLogService) {}

  @Post()
  @Permissions('ERROR_LOG_CREATE')
  @ApiOperation({ summary: 'Log a system error' })
  create(
    @Body() dto: CreateSystemErrorLogDto,
    @CurrentUser() user: any,
  ) {
    return this.errorLogService.create(dto, user?.companyId);
  }

  @Get()
  @Permissions('ERROR_LOG_VIEW')
  @ApiOperation({ summary: 'Get all error logs (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'context', required: false })
  @ApiQuery({ name: 'username', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('context') context?: string,
    @Query('username') username?: string,
    @CurrentUser() user?: any,
  ) {
    return this.errorLogService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      context,
      username,
      companyId: user?.companyId,
    });
  }

  @Get(':id')
  @Permissions('ERROR_LOG_VIEW')
  @ApiOperation({ summary: 'Get error log by ID' })
  findOne(@Param('id') id: string) {
    return this.errorLogService.findOne(id);
  }

  @Delete('clear/:days')
  @Permissions('ERROR_LOG_DELETE')
  @ApiOperation({ summary: 'Clear error logs older than N days' })
  clearOld(
    @Param('days') days: string,
    @CurrentUser() user: any,
  ) {
    return this.errorLogService.clearOlderThan(
      Number(days),
      user?.companyId,
    );
  }
}
