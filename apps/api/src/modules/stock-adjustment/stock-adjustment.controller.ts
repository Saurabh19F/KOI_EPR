import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StockAdjustmentService } from './stock-adjustment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateStockAdjustmentDto } from './dto/stock-adjustment.dto';

@ApiTags('stock-adjustments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock-adjustments')
export class StockAdjustmentController {
  constructor(private readonly adjustmentService: StockAdjustmentService) {}

  @Post()
  @Permissions('STOCK_ADJUSTMENT_CREATE')
  @ApiOperation({ summary: 'Create a stock adjustment log' })
  create(
    @Body() dto: CreateStockAdjustmentDto,
    @CurrentUser() user: any,
  ) {
    return this.adjustmentService.create(dto, user?.userId, user?.companyId);
  }

  @Get()
  @Permissions('STOCK_ADJUSTMENT_VIEW')
  @ApiOperation({ summary: 'Get all stock adjustments (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.adjustmentService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      warehouseId,
      productId,
      companyId: user?.companyId,
    });
  }

  @Get(':id')
  @Permissions('STOCK_ADJUSTMENT_VIEW')
  @ApiOperation({ summary: 'Get stock adjustment by ID' })
  findOne(@Param('id') id: string) {
    return this.adjustmentService.findOne(id);
  }
}
