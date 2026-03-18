import { Module } from '@nestjs/common';
import { ReportService } from './application/services/report.service';
import { ReportController } from './presentation/controllers/report.controller';
import { DepartmentModule } from '@modules/department/department.module';
import { UserModule } from '@modules/user/user.module';
import { PolicyModule } from '@modules/policy/policy.module';
import { PrismaReportRepository } from '@modules/report/infrastructure/report.repository';
import { HolidayModule } from '@modules/holiday/holiday.module';
import { ExcelExportService } from '@modules/report/application/services/excel-export.service';

@Module({
  imports: [DepartmentModule, UserModule, PolicyModule, HolidayModule],
  providers: [
    {
      provide: 'IReportService',
      useClass: ReportService,
    },
    {
      provide: 'IReportRepository',
      useClass: PrismaReportRepository,
    },
    ExcelExportService,
  ],
  controllers: [ReportController],
})
export class ReportModule {}
