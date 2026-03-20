import { Controller, Get, Inject, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import express from 'express';
import * as reportServiceInterface from '@modules/report/application/interfaces/report.service.interface';
import { ExcelExportService } from '@modules/report/application/services/excel-export.service';
import { GetLeaveReportDto } from '@modules/report/application/dto/get-leave-report.dto';
import { GetOTPlanReportDto } from '@modules/report/application/dto/get-ot-plan-report.dto';
import { RolesGuard } from '@modules/jwt/guards/roles.guard';
import { AccessTokenGuard } from '@modules/jwt/guards/access-token.guard';

@UseGuards(AccessTokenGuard, RolesGuard)
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

  @Get('ot-monthly/export')
  @ApiOperation({ summary: 'Export OT monthly report by department' })
  @ApiQuery({ name: 'departmentId', type: String })
  @ApiQuery({ name: 'month', type: Number, example: 1 })
  @ApiQuery({ name: 'year', type: Number, example: 2026 })
  async exportOTMonthly(
    @Query('departmentId') departmentId: string,
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: express.Response,
  ) {
    const report = await this.reportService.getOTMonthlyReport(
      departmentId,
      parseInt(month),
      parseInt(year),
    );
    await this.excelExportService.exportOTMonthly(report, res);
  }

  @Get('ot-monthly/export-all')
  @ApiOperation({ summary: 'Export OT monthly report all departments' })
  @ApiQuery({ name: 'month', type: Number, example: 1 })
  @ApiQuery({ name: 'year', type: Number, example: 2026 })
  async exportOTMonthlyAll(
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: express.Response,
  ) {
    const reports = await this.reportService.getOTMonthlyReportAll(
      parseInt(month),
      parseInt(year),
    );
    await this.excelExportService.exportOTMonthlyAll(reports, res);
  }

  @Get('leave')
  @ApiOperation({ summary: 'Get leave report with filters' })
  async getLeaveReport(@Query() dto: GetLeaveReportDto) {
    return this.reportService.getLeaveReport(dto);
  }

  @Get('ot-plans')
  @ApiOperation({ summary: 'HR get all OT plans with filters' })
  async getAllOTPlanForHR(@Query() dto: GetOTPlanReportDto) {
    return this.reportService.getAllOTPlanForHR(dto);
  }
}
