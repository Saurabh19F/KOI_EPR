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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ProductionJobStatus, BomStatus } from './entities/production.entity';
import {
  CreateProductionJobDto,
  UpdateProductionJobDto,
  CloseProductionJobDto,
  CreateProductionLogDto,
  CreateProductionMergeDetailDto,
  CreateProductionMaterialClosureDto,
  CreateBomDto,
  UpdateBomDto,
} from './dto/production.dto';

@ApiTags('production')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  // ========== JOBS ==========

  @Post('jobs')
  @Permissions('PRODUCTION_CREATE')
  @ApiOperation({ summary: 'Create a production job' })
  createJob(@Body() dto: CreateProductionJobDto, @CurrentUser() user: any) {
    return this.productionService.createJob(dto, user);
  }

  @Get('jobs')
  @Permissions('PRODUCTION_VIEW')
  @ApiOperation({ summary: 'Get all production jobs with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ProductionJobStatus })
  findAllJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: ProductionJobStatus,
    @CurrentUser() user?: any,
  ) {
    return this.productionService.findAllJobs({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
      companyId: user?.companyId,
    });
  }

  @Get('jobs/:id')
  @Permissions('PRODUCTION_VIEW')
  @ApiOperation({ summary: 'Get a production job by ID' })
  findJobById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productionService.findJobById(id, user?.companyId);
  }

  @Patch('jobs/:id')
  @Permissions('PRODUCTION_EDIT')
  @ApiOperation({ summary: 'Update a production job' })
  updateJob(@Param('id') id: string, @Body() dto: UpdateProductionJobDto, @CurrentUser() user: any) {
    return this.productionService.updateJob(id, dto, user);
  }

  @Patch('jobs/:id/start')
  @Permissions('PRODUCTION_EDIT')
  @ApiOperation({ summary: 'Start a production job' })
  startJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productionService.startJob(id, user);
  }

  @Patch('jobs/:id/close')
  @Permissions('PRODUCTION_EDIT')
  @ApiOperation({ summary: 'Close a production job' })
  closeJob(@Param('id') id: string, @Body() dto: CloseProductionJobDto, @CurrentUser() user: any) {
    return this.productionService.closeJob(id, dto, user);
  }

  @Delete('jobs/:id')
  @Permissions('PRODUCTION_DELETE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a production job' })
  deleteJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productionService.deleteJob(id, user);
  }

  // ========== LOGS ==========

  @Post('logs')
  @Permissions('PRODUCTION_CREATE')
  @ApiOperation({ summary: 'Create a production log entry' })
  createLog(@Body() dto: CreateProductionLogDto, @CurrentUser() user: any) {
    return this.productionService.createLog(dto, user);
  }

  @Get('logs')
  @Permissions('PRODUCTION_VIEW')
  @ApiOperation({ summary: 'Get all production logs with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'productionJobId', required: false, type: String })
  findAllLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('productionJobId') productionJobId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.productionService.findAllLogs({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      productionJobId,
      companyId: user?.companyId,
    });
  }

  @Get('logs/:id')
  @Permissions('PRODUCTION_VIEW')
  @ApiOperation({ summary: 'Get a production log by ID' })
  findLogById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productionService.findLogById(id, user?.companyId);
  }

  // ========== MERGE DETAILS ==========

  @Post('merge-details')
  @Permissions('PRODUCTION_CREATE')
  @ApiOperation({ summary: 'Create a production merge detail' })
  createMergeDetail(@Body() dto: CreateProductionMergeDetailDto, @CurrentUser() user: any) {
    return this.productionService.createMergeDetail(dto, user);
  }

  @Get('merge-details')
  @Permissions('PRODUCTION_VIEW')
  @ApiOperation({ summary: 'Get all production merge details with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'productionJobId', required: false, type: String })
  findAllMergeDetails(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('productionJobId') productionJobId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.productionService.findAllMergeDetails({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      productionJobId,
      companyId: user?.companyId,
    });
  }

  // ========== MATERIAL CLOSURES ==========

  @Post('material-closures')
  @Permissions('PRODUCTION_CREATE')
  @ApiOperation({ summary: 'Create a production material closure' })
  createMaterialClosure(@Body() dto: CreateProductionMaterialClosureDto, @CurrentUser() user: any) {
    return this.productionService.createMaterialClosure(dto, user);
  }

  @Get('material-closures')
  @Permissions('PRODUCTION_VIEW')
  @ApiOperation({ summary: 'Get all production material closures with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'productionJobId', required: false, type: String })
  findAllMaterialClosures(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('productionJobId') productionJobId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.productionService.findAllMaterialClosures({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      productionJobId,
      companyId: user?.companyId,
    });
  }

  // ========== BILL OF MATERIALS ==========

  @Post('bom')
  @Permissions('PRODUCTION_CREATE')
  @ApiOperation({ summary: 'Create a Bill of Materials' })
  createBom(@Body() dto: CreateBomDto, @CurrentUser() user: any) {
    return this.productionService.createBom(dto, user);
  }

  @Get('bom')
  @Permissions('PRODUCTION_VIEW')
  @ApiOperation({ summary: 'Get all BOMs with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BomStatus })
  findAllBoms(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: BomStatus,
    @CurrentUser() user?: any,
  ) {
    return this.productionService.findAllBoms({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      productId,
      status,
      companyId: user?.companyId,
    });
  }

  @Get('bom/:id')
  @Permissions('PRODUCTION_VIEW')
  @ApiOperation({ summary: 'Get a BOM by ID with items' })
  findBomById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productionService.findBomById(id, user?.companyId);
  }

  @Get('bom/product/:productId')
  @Permissions('PRODUCTION_VIEW')
  @ApiOperation({ summary: 'Get active BOMs for a product' })
  findBomByProduct(@Param('productId') productId: string, @CurrentUser() user: any) {
    return this.productionService.findBomByProduct(productId, user?.companyId);
  }

  @Patch('bom/:id')
  @Permissions('PRODUCTION_EDIT')
  @ApiOperation({ summary: 'Update a BOM' })
  updateBom(@Param('id') id: string, @Body() dto: UpdateBomDto, @CurrentUser() user: any) {
    return this.productionService.updateBom(id, dto, user);
  }

  @Delete('bom/:id')
  @Permissions('PRODUCTION_DELETE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a BOM' })
  deleteBom(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productionService.deleteBom(id, user);
  }
}
