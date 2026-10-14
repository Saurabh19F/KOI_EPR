import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { GstReportService } from './services/gst-report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports/gst')
@UseGuards(JwtAuthGuard)
export class GstReportController {
  constructor(private readonly gstReportService: GstReportService) {}

  @Get('summary')
  getGstSummary(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.gstReportService.getGstSummary(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('liability')
  getGstLiability(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.gstReportService.getGstLiabilityReport(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('gstr-1')
  getGstr1(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.gstReportService.getGstr1Report(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('gstr-3b')
  getGstr3b(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.gstReportService.getGstr3bSummary(
      new Date(fromDate),
      new Date(toDate),
    );
  }
}
