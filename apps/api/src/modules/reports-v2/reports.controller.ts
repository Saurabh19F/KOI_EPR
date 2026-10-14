import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import {
  CreateReportDefinitionDto,
  UpdateReportDefinitionDto,
  GenerateReportDto,
  QueryReportDto,
  CreateScheduledReportDto,
  UpdateScheduledReportDto,
  CreateChartDefinitionDto,
  SaveDashboardDto,
  ReportTypeValue,
  ReportFormatValue,
} from './dto/report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ============ Standard Reports ============

  @Get('standard')
  @ApiOperation({ summary: 'Get list of standard reports' })
  @ApiResponse({ status: 200, description: 'Standard reports list' })
  async getStandardReports(@Request() req: any) {
    return this.reportsService.getStandardReports(req.user.companyId);
  }

  @Post('standard/:reportId/generate')
  @ApiOperation({ summary: 'Generate a standard report' })
  @ApiResponse({ status: 201, description: 'Report generation started' })
  async generateStandardReport(
    @Param('reportId') reportId: string,
    @Body() dto: { format?: ReportFormatValue; startDate?: Date; endDate?: Date },
    @Request() req: any,
  ) {
    return this.reportsService.generateStandardReport(
      reportId,
      dto,
      req.user.companyId,
      req.user.userId,
    );
  }

  // ============ Report Definitions ============

  @Post('definitions')
  @ApiOperation({ summary: 'Create a custom report definition' })
  @ApiResponse({ status: 201, description: 'Report definition created' })
  async createReportDefinition(
    @Body() dto: CreateReportDefinitionDto,
    @Request() req: any,
  ) {
    return this.reportsService.createReportDefinition(dto, req.user.userId, req.user.companyId);
  }

  @Get('definitions')
  @ApiOperation({ summary: 'Get all report definitions' })
  @ApiResponse({ status: 200, description: 'Report definitions list' })
  async getReportDefinitions(
    @Query('type') type: ReportTypeValue,
    @Request() req: any,
  ) {
    return this.reportsService.getReportDefinitions(req.user.companyId, type);
  }

  @Get('definitions/:id')
  @ApiOperation({ summary: 'Get report definition by ID' })
  @ApiResponse({ status: 200, description: 'Report definition details' })
  async getReportDefinition(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.getReportDefinitionById(id, req.user.companyId);
  }

  @Put('definitions/:id')
  @ApiOperation({ summary: 'Update report definition' })
  @ApiResponse({ status: 200, description: 'Report definition updated' })
  async updateReportDefinition(
    @Param('id') id: string,
    @Body() dto: UpdateReportDefinitionDto,
    @Request() req: any,
  ) {
    return this.reportsService.updateReportDefinition(id, dto, req.user.userId, req.user.companyId);
  }

  @Delete('definitions/:id')
  @ApiOperation({ summary: 'Delete report definition' })
  @ApiResponse({ status: 200, description: 'Report definition deleted' })
  async deleteReportDefinition(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.deleteReportDefinition(id, req.user.companyId);
  }

  // ============ Report Generation ============

  @Post('generate')
  @ApiOperation({ summary: 'Generate a report' })
  @ApiResponse({ status: 201, description: 'Report generation started' })
  async generateReport(
    @Body() dto: GenerateReportDto,
    @Request() req: any,
  ) {
    const parameters = dto.parameters ? JSON.parse(dto.parameters as any) : undefined;
    const filters = dto.filters ? JSON.parse(dto.filters as any) : undefined;

    return this.reportsService.generateReport(
      {
        reportId: dto.reportId,
        format: dto.format,
        parameters,
        filters,
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
      req.user.userId,
      req.user.companyId,
    );
  }

  @Get('generated')
  @ApiOperation({ summary: 'Get generated reports' })
  @ApiResponse({ status: 200, description: 'Generated reports list' })
  async getGeneratedReports(
    @Query() query: QueryReportDto,
    @Request() req: any,
  ) {
    return this.reportsService.getGeneratedReports(req.user.companyId, query);
  }

  @Get('generated/:id')
  @ApiOperation({ summary: 'Get generated report by ID' })
  @ApiResponse({ status: 200, description: 'Generated report details' })
  async getGeneratedReport(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.getGeneratedReportById(id, req.user.companyId);
  }

  @Get('generated/:id/download')
  @ApiOperation({ summary: 'Download generated report' })
  @ApiResponse({ status: 200, description: 'File download' })
  async downloadReport(
    @Param('id') id: string,
    @Res() res: Response,
    @Request() req: any,
  ) {
    const { filePath, fileName } = await this.reportsService.downloadReport(id, req.user.companyId);
    const extension = fileName.split('.').pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
    };

    res.setHeader('Content-Type', contentTypes[extension || 'pdf'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Delete('generated/:id')
  @ApiOperation({ summary: 'Delete generated report' })
  @ApiResponse({ status: 200, description: 'Report deleted' })
  async deleteGeneratedReport(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.deleteGeneratedReport(id, req.user.companyId);
  }

  // ============ Scheduled Reports ============

  @Post('scheduled')
  @ApiOperation({ summary: 'Create scheduled report' })
  @ApiResponse({ status: 201, description: 'Scheduled report created' })
  async createScheduledReport(
    @Body() dto: CreateScheduledReportDto,
    @Request() req: any,
  ) {
    return this.reportsService.createScheduledReport(dto, req.user.userId, req.user.companyId);
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get scheduled reports' })
  @ApiResponse({ status: 200, description: 'Scheduled reports list' })
  async getScheduledReports(@Request() req: any) {
    return this.reportsService.getScheduledReports(req.user.companyId);
  }

  @Put('scheduled/:id')
  @ApiOperation({ summary: 'Update scheduled report' })
  @ApiResponse({ status: 200, description: 'Scheduled report updated' })
  async updateScheduledReport(
    @Param('id') id: string,
    @Body() dto: UpdateScheduledReportDto,
    @Request() req: any,
  ) {
    return this.reportsService.updateScheduledReport(id, dto, req.user.companyId);
  }

  @Delete('scheduled/:id')
  @ApiOperation({ summary: 'Delete scheduled report' })
  @ApiResponse({ status: 200, description: 'Scheduled report deleted' })
  async deleteScheduledReport(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.deleteScheduledReport(id, req.user.companyId);
  }

  // ============ Charts ============

  @Post('charts')
  @ApiOperation({ summary: 'Create chart definition' })
  @ApiResponse({ status: 201, description: 'Chart created' })
  async createChartDefinition(
    @Body() dto: CreateChartDefinitionDto,
    @Request() req: any,
  ) {
    return this.reportsService.createChartDefinition(dto, req.user.userId, req.user.companyId);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get chart definitions' })
  @ApiResponse({ status: 200, description: 'Charts list' })
  async getChartDefinitions(
    @Query('type') type: ReportTypeValue,
    @Request() req: any,
  ) {
    return this.reportsService.getChartDefinitions(req.user.companyId, type);
  }

  @Get('charts/:id/data')
  @ApiOperation({ summary: 'Get chart data' })
  @ApiResponse({ status: 200, description: 'Chart data' })
  async getChartData(
    @Param('id') id: string,
    @Query() parameters: Record<string, any>,
    @Request() req: any,
  ) {
    return this.reportsService.getChartData(id, parameters, req.user.companyId);
  }

  @Delete('charts/:id')
  @ApiOperation({ summary: 'Delete chart definition' })
  @ApiResponse({ status: 200, description: 'Chart deleted' })
  async deleteChartDefinition(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.deleteChartDefinition(id, req.user.companyId);
  }

  // ============ Dashboard ============

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard widgets' })
  async getDashboard(@Request() req: any) {
    const charts = await this.reportsService.getChartDefinitions(req.user.companyId);
    const standardReports = await this.reportsService.getStandardReports(req.user.companyId);

    return {
      widgets: charts.slice(0, 6).map((chart: any) => ({
        chartId: chart.chartId,
        name: chart.name,
        chartType: chart.chartType,
        position: 0,
      })),
      quickReports: standardReports.slice(0, 8),
    };
  }

  @Post('dashboard')
  @ApiOperation({ summary: 'Save dashboard layout' })
  @ApiResponse({ status: 201, description: 'Dashboard saved' })
  async saveDashboard(
    @Body() dto: SaveDashboardDto,
    @Request() req: any,
  ) {
    // In a full implementation, this would save to a Dashboard entity
    return { success: true, message: 'Dashboard layout saved' };
  }
}
