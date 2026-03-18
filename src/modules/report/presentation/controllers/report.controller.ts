import { Controller, Get, Inject, Query, Res } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import express from 'express';
import * as reportServiceInterface from '@modules/report/application/interfaces/report.service.interface';
import { ExcelExportService } from '@modules/report/application/services/excel-export.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(
    @Inject('IReportService')
    private readonly reportService: reportServiceInterface.IReportService,
    @Inject(ExcelExportService)
    private readonly excelExportService: ExcelExportService,
  ) {}

  @Get('leave-monthly/export-all')
  @ApiQuery({ name: 'month', required: true, example: 2 })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  async exportLeaveMonthlyAll(
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: express.Response,
  ) {
    const report = await this.reportService.getLeaveMonthlyReportAll(
      parseInt(month),
      parseInt(year),
    );
    await this.excelExportService.exportLeaveMonthly(report, res);
  }

  @Get('leave-yearly/export-all')
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  async exportLeaveYearlyAll(
    @Query('year') year: string,
    @Res() res: express.Response,
  ) {
    const report = await this.reportService.getLeaveYearlyReportAll(
      parseInt(year),
    );
    await this.excelExportService.exportLeaveYearly(report, res);
  }
}
